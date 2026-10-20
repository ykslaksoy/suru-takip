/**
 * Yem envanteri + parti rasyonu — saf hesap.
 * Rasyon: parti (padok) başına kg/baş/gün bileşenler. Günlük düşüm: başlangıçtan / son düşümden bugüne
 * kadar bekleyen günler × baş × kg. Fiyat: ağırlıklı ortalama alış ₺/kg.
 */

export type RasyonKalemi = { stockId: string; kgBasGun: number };

export type PartiRasyonu = {
  id: string;
  parti: string;
  ad?: string;
  kalemler: RasyonKalemi[];
  /** YYYY-MM-DD: bu günden itibaren düşülür */
  baslangic: string;
  /** Son düşülen gün (YYYY-MM-DD) */
  sonDusum: string | null;
  aktif: boolean;
  guncelleme: string;
};

export type YemAlimi = {
  id: string;
  stockId: string;
  tarih: string;
  kg: number;
  fiyatKg: number;
  tedarikci?: string;
};

export type DusumKalemi = { rasyonId: string; parti: string; stockId: string; kg: number; gunSayisi: number; ilkGun: string; sonGun: string; bas: number };

export const EN_COK_GERIYE_GUN = 60;
export const AZ_KALDI_GUN = 7;

const GUN = 86400000;

export function gunEkle(iso: string, n: number): string {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * GUN;
  return new Date(t).toISOString().slice(0, 10);
}

export function gunFarki(a: string, b: string): number {
  const t = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(b) - t(a)) / GUN);
}

/** Düşülmesi bekleyen günler (bugün dahil), en çok EN_COK_GERIYE_GUN */
export function bekleyenGunler(r: Pick<PartiRasyonu, 'baslangic' | 'sonDusum' | 'aktif'>, bugun: string): string[] {
  if (!r.aktif) return [];
  let ilk = r.sonDusum ? gunEkle(r.sonDusum, 1) : r.baslangic;
  if (ilk < r.baslangic) ilk = r.baslangic;
  if (ilk > bugun) return [];
  const enEski = gunEkle(bugun, -(EN_COK_GERIYE_GUN - 1));
  if (ilk < enEski) ilk = enEski;
  const n = gunFarki(ilk, bugun) + 1;
  return Array.from({ length: n }, (_, i) => gunEkle(ilk, i));
}

function yuvarla(n: number, b = 2): number {
  const k = 10 ** b;
  return Math.round(n * k) / k;
}

/** Bekleyen günler için düşülecek kg (parti × yem) */
export function dusumPlani(rasyonlar: PartiRasyonu[], basSayisi: Record<string, number>, bugun: string): DusumKalemi[] {
  const out: DusumKalemi[] = [];
  for (const r of rasyonlar) {
    const gunler = bekleyenGunler(r, bugun);
    const bas = basSayisi[r.parti] ?? 0;
    if (!gunler.length || bas <= 0) continue;
    for (const k of r.kalemler) {
      if (!(k.kgBasGun > 0)) continue;
      out.push({
        rasyonId: r.id,
        parti: r.parti,
        stockId: k.stockId,
        kg: yuvarla(k.kgBasGun * bas * gunler.length),
        gunSayisi: gunler.length,
        ilkGun: gunler[0],
        sonGun: gunler[gunler.length - 1],
        bas,
      });
    }
  }
  return out;
}

/** Bekleyen gün var ama parti boşsa yine de sonDusum ilerler (boş günler borç olmasın) */
export function ilerletilecekRasyonlar(rasyonlar: PartiRasyonu[], bugun: string): string[] {
  return rasyonlar.filter((r) => bekleyenGunler(r, bugun).length > 0).map((r) => r.id);
}

/** Yem başına günlük toplam tüketim (kg/gün) — aktif rasyonlar */
export function gunlukTuketim(rasyonlar: PartiRasyonu[], basSayisi: Record<string, number>): Record<string, number> {
  const t: Record<string, number> = {};
  for (const r of rasyonlar) {
    if (!r.aktif) continue;
    const bas = basSayisi[r.parti] ?? 0;
    for (const k of r.kalemler) t[k.stockId] = yuvarla((t[k.stockId] ?? 0) + k.kgBasGun * bas);
  }
  return t;
}

/** Stok kaç gün yeter (tüketim yoksa null) */
export function kacGunYeter(stokKg: number, gunlukKg: number | undefined): number | null {
  if (!gunlukKg || gunlukKg <= 0) return null;
  return Math.floor(Math.max(0, stokKg) / gunlukKg);
}

export type YemDurumu = {
  stockId: string;
  ad: string;
  stokKg: number;
  minKg: number;
  gunlukKg: number;
  yeterGun: number | null;
  fiyatKg: number | null;
  uyari: 'bitti' | 'az' | 'min' | null;
};

export function yemDurumlari(
  yemler: { id: string; name: string; quantity: number; minQuantity: number }[],
  tuketim: Record<string, number>,
  fiyatlar: Record<string, number>,
): YemDurumu[] {
  return yemler
    .map((y) => {
      const gunlukKg = tuketim[y.id] ?? 0;
      const yeterGun = kacGunYeter(y.quantity, gunlukKg);
      const uyari: YemDurumu['uyari'] =
        y.quantity <= 0 && gunlukKg > 0 ? 'bitti' : yeterGun != null && yeterGun < AZ_KALDI_GUN ? 'az' : y.quantity <= y.minQuantity ? 'min' : null;
      return { stockId: y.id, ad: y.name, stokKg: y.quantity, minKg: y.minQuantity, gunlukKg, yeterGun, fiyatKg: fiyatlar[y.id] ?? null, uyari };
    })
    .sort((a, b) => (a.uyari ? 0 : 1) - (b.uyari ? 0 : 1) || (a.yeterGun ?? 9999) - (b.yeterGun ?? 9999) || a.ad.localeCompare(b.ad, 'tr'));
}

/** Eldeki stok + yeni alım → ağırlıklı ortalama ₺/kg */
export function agirlikliFiyat(eldeKg: number, eskiFiyat: number | null | undefined, yeniKg: number, yeniFiyat: number): number {
  const e = Math.max(0, eldeKg);
  if (!eskiFiyat || e <= 0) return yuvarla(yeniFiyat);
  return yuvarla((e * eskiFiyat + yeniKg * yeniFiyat) / (e + yeniKg));
}

/** "12,5" / "1.250" → sayı */
export function sayiOku(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  if (!t) return null;
  const n = Number(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Rasyon günlük maliyeti: parti için ₺/gün ve ₺/baş/gün */
export function rasyonMaliyeti(r: PartiRasyonu, bas: number, fiyatlar: Record<string, number>): { kgBasGun: number; tlBasGun: number; tlGun: number; fiyatsiz: number } {
  let kg = 0;
  let tl = 0;
  let fiyatsiz = 0;
  for (const k of r.kalemler) {
    kg += k.kgBasGun;
    const f = fiyatlar[k.stockId];
    if (f) tl += k.kgBasGun * f;
    else if (k.kgBasGun > 0) fiyatsiz += 1;
  }
  return { kgBasGun: yuvarla(kg), tlBasGun: yuvarla(tl), tlGun: yuvarla(tl * bas), fiyatsiz };
}

export function rasyonDogrula(r: Pick<PartiRasyonu, 'parti' | 'kalemler'>): string | null {
  if (!r.parti.trim()) return 'Parti / padok seç';
  const dolu = r.kalemler.filter((k) => k.kgBasGun > 0);
  if (!dolu.length) return 'En az bir yeme kg/baş/gün gir';
  if (dolu.some((k) => k.kgBasGun > 6)) return 'Bir yem için 6 kg/baş/gün üstü olamaz — birimi kontrol et';
  if (new Set(dolu.map((k) => k.stockId)).size !== dolu.length) return 'Aynı yem iki kez eklenmiş';
  return null;
}

/** Hareket notu — maliyet hesabı parti adını nottan okur */
export function dusumNotu(d: Pick<DusumKalemi, 'parti' | 'gunSayisi' | 'ilkGun' | 'sonGun' | 'bas'>): string {
  const tr = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}`;
  return `Rasyon · ${d.parti} · ${d.bas} baş · ${d.gunSayisi === 1 ? tr(d.sonGun) : `${d.gunSayisi} gün (${tr(d.ilkGun)}–${tr(d.sonGun)})`}`;
}

/** Takvim: yemin tahmini bitiş günü (60 gün içinde) */
export function yemBitisOlaylari(durumlar: YemDurumu[], bugun: string): { id: string; tarih: string; tur: 'gorev'; baslik: string; aciklama: string; href: string }[] {
  return durumlar
    .filter((d) => d.yeterGun != null && d.yeterGun <= 60)
    .map((d) => ({
      id: `yem-bitis-${d.stockId}`,
      tarih: gunEkle(bugun, d.yeterGun!),
      tur: 'gorev' as const,
      baslik: `🌾 ${d.ad} bitiyor (tahmini)`,
      aciklama: `${Math.round(d.stokKg)} kg stok · günde ${Math.round(d.gunlukKg)} kg rasyon`,
      href: '/yem',
    }));
}
