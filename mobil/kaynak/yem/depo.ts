/** Yem envanteri + parti rasyonu — depo işlemleri, otomatik günlük düşüm */
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import { v4 as uuidv4 } from 'uuid';
import { adjustStock, getAnimals, getStockItems, upsertStockItem } from '@/kaynak/cekirdek/veritabani';
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { getBirimFiyatlar, setBirimFiyat } from '@/kaynak/stok/fiyat';
import { getLatestWeight } from '@/kaynak/cekirdek/veritabani';
import { EKSIK_YEM_ADI, partiOrtalamaKg, rasyonOnerisi, rasyonsuzPartiler, type RasyonOnerisi } from './oneri';
import type { RationPhase } from '@/kaynak/rasyon/hesapla';
import { standartYem } from '@/kaynak/rasyon/yem-besin';
import { etkinFiyatlar } from '@/kaynak/maliyet/tahmini-fiyat';
import { copeAt, islemKaydet } from '@/kaynak/gecmis/gunluk';
import { denetimYaz } from '@/kaynak/cekirdek/denetim';
import { yerelGun } from '@/kaynak/arinma/depo';
import {
  agirlikliFiyat,
  dusumNotu,
  dusumPlani,
  gunlukTuketim,
  ilerletilecekRasyonlar,
  rasyonDogrula,
  yemDurumlari,
  type PartiRasyonu,
  type RasyonKalemi,
  type YemAlimi,
  type YemDurumu,
} from './hesap';
import { alimlariOku, alimlariYaz, dusumleriOku, dusumleriYaz, rasyonlariOku, rasyonlariYaz, type DusumKaydi } from './kayit';

export async function partiBasSayilari(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const a of await getAnimals()) {
    if (a.status === 'sold' || a.status === 'dead' || !a.paddock?.trim()) continue;
    out[a.paddock] = (out[a.paddock] ?? 0) + 1;
  }
  return out;
}

export async function getYemler(): Promise<StockItem[]> {
  return (await getStockItems()).filter((s) => s.type === 'feed');
}

/** Gerçek alış fiyatı, yoksa piyasa tahmini (maliyet ekranıyla aynı) */
export async function yemFiyatlari(yemler?: StockItem[]): Promise<Record<string, number>> {
  const l = yemler ?? (await getYemler());
  return etkinFiyatlar(l, await getBirimFiyatlar()).fiyatlar;
}

export async function getRasyonlar(): Promise<PartiRasyonu[]> {
  return rasyonlariOku();
}

export async function rasyonKaydet(input: { id?: string; parti: string; ad?: string; kalemler: RasyonKalemi[]; baslangic?: string }): Promise<PartiRasyonu> {
  yetkiGerekli('duzenleme');
  const hata = rasyonDogrula(input);
  if (hata) throw new Error(hata);
  const l = await rasyonlariOku();
  const eski = input.id ? l.find((r) => r.id === input.id) : undefined;
  const bugun = yerelGun();
  const kayit: PartiRasyonu = {
    id: eski?.id ?? uuidv4(),
    parti: input.parti.trim(),
    ad: input.ad?.trim() || undefined,
    kalemler: input.kalemler.filter((k) => k.kgBasGun > 0),
    baslangic: eski?.baslangic ?? input.baslangic ?? bugun,
    // Düzenlemede geçmiş günler yeniden düşülmez; yeni miktar ertesi günden işler
    sonDusum: eski ? eski.sonDusum : null,
    aktif: true,
    guncelleme: new Date().toISOString(),
  };
  // Bir partide tek aktif rasyon
  const yeni = [kayit, ...l.filter((r) => r.id !== kayit.id).map((r) => (r.parti === kayit.parti && r.aktif ? { ...r, aktif: false } : r))];
  await rasyonlariYaz(yeni);
  denetimYaz({ eylem: eski ? 'guncelleme' : 'ekleme', tablo: 'yem', kayitId: kayit.id, ozet: `Rasyon · ${kayit.parti} · ${kayit.kalemler.length} yem` });
  return kayit;
}

export async function rasyonDurdur(id: string, aktif: boolean): Promise<void> {
  yetkiGerekli('duzenleme');
  const l = await rasyonlariOku();
  const r = l.find((x) => x.id === id);
  if (!r) return;
  const bugun = yerelGun();
  await rasyonlariYaz(
    l.map((x) =>
      x.id === id
        ? // Yeniden başlatınca durdurulduğu günler düşülmesin
          { ...x, aktif, sonDusum: aktif ? (x.sonDusum && x.sonDusum > bugun ? x.sonDusum : gunOnce(bugun)) : x.sonDusum }
        : aktif && x.parti === r.parti
          ? { ...x, aktif: false }
          : x,
    ),
  );
  denetimYaz({ eylem: 'guncelleme', tablo: 'yem', kayitId: id, ozet: `Rasyon ${aktif ? 'başlatıldı' : 'durduruldu'} · ${r.parti}` });
}

function gunOnce(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function rasyonSil(id: string): Promise<void> {
  yetkiGerekli('silme');
  const l = await rasyonlariOku();
  const r = l.find((x) => x.id === id);
  if (!r) return;
  await rasyonlariYaz(l.filter((x) => x.id !== id));
  await copeAt({ id: `yem-${id}-${Date.now()}`, tur: 'yem', etiket: `Rasyon · ${r.parti}`, veri: r });
  denetimYaz({ eylem: 'silme', tablo: 'yem', kayitId: id, ozet: `Rasyon · ${r.parti}` });
}

/** Yem alımı: stok girişi + ağırlıklı ortalama ₺/kg */
export async function yemAlimiEkle(a: { stockId?: string; yeniAd?: string; kg: number; fiyatKg: number; tarih?: string; tedarikci?: string }): Promise<YemAlimi> {
  yetkiGerekli('finans');
  if (!(a.kg > 0)) throw new Error('Miktar (kg) gir');
  if (!(a.fiyatKg > 0)) throw new Error('₺/kg gir');
  let item = a.stockId ? (await getYemler()).find((s) => s.id === a.stockId) : undefined;
  if (!item) {
    const ad = (a.yeniAd ?? '').trim();
    if (!ad) throw new Error('Yem seç ya da yeni yem adı yaz');
    const ayni = (await getYemler()).find((s) => s.name.trim().toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
    item = ayni ?? (await upsertStockItem({ name: ad, type: 'feed', quantity: 0, unit: 'kg', minQuantity: 50, expiryDate: null, notes: 'Yem alımı ile eklendi' }));
  }
  const fiyatlar = await getBirimFiyatlar();
  const yeniFiyat = agirlikliFiyat(item.quantity, fiyatlar[item.id], a.kg, a.fiyatKg);
  const tarih = a.tarih ?? yerelGun();
  await adjustStock(item.id, 'in', a.kg, `Alım · ${a.kg} kg × ${a.fiyatKg.toLocaleString('tr-TR')} ₺/kg${a.tedarikci ? ` · ${a.tedarikci}` : ''}`);
  await setBirimFiyat(item.id, yeniFiyat);
  const alim: YemAlimi = { id: uuidv4(), stockId: item.id, tarih, kg: a.kg, fiyatKg: a.fiyatKg, tedarikci: a.tedarikci?.trim() || undefined };
  await alimlariYaz([alim, ...(await alimlariOku())]);
  await islemKaydet({ tur: 'stok', ozet: `Yem alımı · ${item.name} ${a.kg.toLocaleString('tr-TR')} kg · ${Math.round(a.kg * a.fiyatKg).toLocaleString('tr-TR')} ₺` }).catch(() => undefined);
  return alim;
}

export async function getAlimlar(): Promise<YemAlimi[]> {
  return alimlariOku();
}

export async function getDusumler(): Promise<DusumKaydi[]> {
  return dusumleriOku();
}

let calisiyor: Promise<DusumKaydi | null> | null = null;

/**
 * Bekleyen günlerin rasyonunu stoktan düşer. Uygulama her açıldığında çalışır; aynı gün iki kez düşmez.
 * Stok yetmezse eldeki kadar düşer, eksik kaydedilir.
 */
export function gunlukYemDusumu(bugun = yerelGun()): Promise<DusumKaydi | null> {
  if (!calisiyor) calisiyor = dusumYap(bugun).finally(() => (calisiyor = null));
  return calisiyor;
}

async function dusumYap(bugun: string): Promise<DusumKaydi | null> {
  const rasyonlar = await rasyonlariOku();
  const ilerlet = new Set(ilerletilecekRasyonlar(rasyonlar, bugun));
  if (!ilerlet.size) return null;
  const plan = dusumPlani(rasyonlar, await partiBasSayilari(), bugun);
  const kalan = new Map((await getYemler()).map((s) => [s.id, s.quantity]));
  const kalemler: DusumKaydi['kalemler'] = [];
  for (const d of plan) {
    const elde = kalan.get(d.stockId);
    if (elde == null) continue; // yem silinmiş
    const dusulen = Math.round(Math.min(d.kg, Math.max(0, elde)) * 100) / 100;
    if (dusulen > 0) await adjustStock(d.stockId, 'out', dusulen, dusumNotu(d));
    kalan.set(d.stockId, elde - dusulen);
    kalemler.push({ ...d, dusulen, eksik: Math.round((d.kg - dusulen) * 100) / 100 });
  }
  await rasyonlariYaz(rasyonlar.map((r) => (ilerlet.has(r.id) ? { ...r, sonDusum: bugun } : r)));
  const kayit: DusumKaydi = { id: uuidv4(), zaman: new Date().toISOString(), gun: bugun, kalemler };
  if (kalemler.length) {
    await dusumleriYaz([kayit, ...(await dusumleriOku())]);
    const top = kalemler.reduce((s, k) => s + k.dusulen, 0);
    const eksik = kalemler.reduce((s, k) => s + k.eksik, 0);
    await islemKaydet({
      tur: 'stok',
      ozet: `Rasyon düşümü · ${Math.round(top).toLocaleString('tr-TR')} kg yem`,
      detay: eksik > 0 ? `${Math.round(eksik)} kg stok yetmedi` : undefined,
      adet: kalemler.length,
    }).catch(() => undefined);
  }
  return kayit;
}

export type YemOzeti = {
  rasyonlar: PartiRasyonu[];
  yemler: StockItem[];
  durumlar: YemDurumu[];
  basSayisi: Record<string, number>;
  fiyatlar: Record<string, number>;
  partiler: string[];
};

export async function getYemOzeti(): Promise<YemOzeti> {
  const [rasyonlar, yemler, basSayisi] = await Promise.all([rasyonlariOku(), getYemler(), partiBasSayilari()]);
  const fiyatlar = await yemFiyatlari(yemler);
  const aktif = rasyonlar.filter((r) => r.aktif);
  return {
    rasyonlar,
    yemler,
    durumlar: yemDurumlari(yemler, gunlukTuketim(aktif, basSayisi), fiyatlar),
    basSayisi,
    fiyatlar,
    partiler: Object.keys(basSayisi).sort((a, b) => a.localeCompare(b, 'tr')),
  };
}

/** Görevler için: az kalan / biten yemler */
export async function yemUyarilari(): Promise<YemDurumu[]> {
  const o = await getYemOzeti();
  return o.durumlar.filter((d) => d.uyari === 'bitti' || d.uyari === 'az');
}

/** Kuzusu olup aktif rasyonu olmayan partiler için öneri (son tartım ortalaması + baş sayısı) */
export async function rasyonsuzOneriler(fazlar: Record<string, RationPhase> = {}): Promise<RasyonOnerisi[]> {
  const [rasyonlar, yemler, hayvanlar] = await Promise.all([rasyonlariOku(), getYemler(), getAnimals()]);
  const canli = hayvanlar.filter((a) => a.status !== 'sold' && a.status !== 'dead' && a.paddock?.trim());
  const bas: Record<string, number> = {};
  for (const a of canli) bas[a.paddock] = (bas[a.paddock] ?? 0) + 1;
  const eksikler = rasyonsuzPartiler(bas, rasyonlar);
  if (!eksikler.length) return [];
  const set = new Set(eksikler);
  const ilgili = canli.filter((a) => set.has(a.paddock));
  const kg = await Promise.all(ilgili.map((a) => getLatestWeight(a.id).catch(() => null)));
  const ort = partiOrtalamaKg(ilgili.map((a, i) => ({ paddock: a.paddock, sonKg: kg[i] })));
  return eksikler.map((p) => rasyonOnerisi({ parti: p, bas: bas[p], ortKg: ort[p] ?? null, faz: fazlar[p], yemler }));
}

/** Öneriyi rasyon olarak kaydet; stokta olmayan yem 0 kg ile stoğa eklenir (alım yapılınca düşüm başlar) */
export async function oneriyiUygula(o: RasyonOnerisi): Promise<PartiRasyonu> {
  yetkiGerekli('duzenleme');
  const yemler = await getYemler();
  const kalemler: RasyonKalemi[] = [];
  for (const k of o.kalemler) {
    let id = k.stockId;
    if (!id) {
      const ad = EKSIK_YEM_ADI[k.sinif];
      const ayni = yemler.find((s) => s.name.trim().toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
      const item =
        ayni ?? (await upsertStockItem({ name: ad, type: 'feed', quantity: 0, unit: 'kg', minQuantity: 50, expiryDate: null, notes: 'Rasyon önerisiyle eklendi — alım gir' }));
      if (!ayni) yemler.push(item);
      id = item.id;
    }
    const var_ = kalemler.find((x) => x.stockId === id);
    if (var_) var_.kgBasGun = Math.round((var_.kgBasGun + k.kgBasGun) * 100) / 100;
    else kalemler.push({ stockId: id, kgBasGun: k.kgBasGun });
  }
  return rasyonKaydet({ parti: o.parti, ad: 'Önerilen rasyon', kalemler });
}

/** Görevler için: kuzusu olup rasyonu olmayan partiler */
export async function rasyonsuzPartiUyarilari(): Promise<{ parti: string; bas: number }[]> {
  const [rasyonlar, bas] = await Promise.all([rasyonlariOku(), partiBasSayilari()]);
  return rasyonsuzPartiler(bas, rasyonlar).map((p) => ({ parti: p, bas: bas[p] }));
}

/** Parti başına son tartım ortalaması (tartım yoksa null) */
export async function partiOrtalamalari(): Promise<Record<string, number | null>> {
  const canli = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead' && a.paddock?.trim());
  const kg = await Promise.all(canli.map((a) => getLatestWeight(a.id).catch(() => null)));
  return partiOrtalamaKg(canli.map((a, i) => ({ paddock: a.paddock, sonKg: kg[i] })));
}

/** Ada göre stok yemine eşle (yoksa 0 kg ile stoğa ekle) ve rasyon olarak kaydet */
export async function adliRasyonUygula(parti: string, ad: string, kalemler: { ad: string; stockId?: string; kgBasGun: number }[]): Promise<PartiRasyonu> {
  yetkiGerekli('duzenleme');
  const yemler = await getYemler();
  const norm = (s: string) => s.trim().toLocaleLowerCase('tr');
  const out: RasyonKalemi[] = [];
  for (const k of kalemler) {
    if (!(k.kgBasGun > 0)) continue;
    let id = k.stockId && yemler.some((y) => y.id === k.stockId) ? k.stockId : undefined;
    if (!id) {
      const ayni = yemler.find((y) => norm(y.name) === norm(k.ad)) ?? (() => { const st = standartYem(k.ad)?.ad; return st ? yemler.find((y) => standartYem(y.name)?.ad === st) : undefined; })();
      const item = ayni ?? (await upsertStockItem({ name: k.ad, type: 'feed', quantity: 0, unit: 'kg', minQuantity: 50, expiryDate: null, notes: 'Rasyonla eklendi — alım gir' }));
      if (!ayni) yemler.push(item);
      id = item.id;
    }
    const v = out.find((x) => x.stockId === id);
    if (v) v.kgBasGun = Math.round((v.kgBasGun + k.kgBasGun) * 1000) / 1000;
    else out.push({ stockId: id, kgBasGun: Math.round(k.kgBasGun * 1000) / 1000 });
  }
  const aktif = (await rasyonlariOku()).find((r) => r.parti === parti && r.aktif);
  return rasyonKaydet({ id: aktif?.id, parti, ad, kalemler: out });
}
