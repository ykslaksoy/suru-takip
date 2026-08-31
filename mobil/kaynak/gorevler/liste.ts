import {
  getActiveWithdrawals,
  getAnimals,
  getAllHealthRecordsForAsi,
  getLatestWeight,
  getLowStockItems,
  getStockItems,
} from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { asiStokUyarilari, hesaplaAsiStokDurumu } from '@/kaynak/cekirdek/asi-programi';
import { asiTopluGorevleri } from '@/kaynak/gorevler/asi-gorev';
import { getAktifModId, getMod } from '@/sabitler/Modlar';
import { aktifPlanOku } from '@/kaynak/akilli-veteriner/mod-takviye';
import { getMod1BirlesikIlerleme, sonrakiAcikAdim } from '@/kaynak/besi-ortak';
import { getMod2BirlesikIlerleme, sonrakiAcikAdimMod2 } from '@/kaynak/besi-koc-kat';
import { getMod3BirlesikIlerleme, sonrakiAcikAdimMod3 } from '@/kaynak/damizlik';
import { getMod4BirlesikIlerleme, sonrakiAcikAdimMod4 } from '@/kaynak/sut';
import { getPlanlananGorevler } from '@/kaynak/gorevler/planlanan';
import {
  getIsPlaniKayitlari,
  IS_PLANI_META,
  isPlaniAciklama,
  isPlaniKalanGun,
  type IsPlaniTur,
} from '@/kaynak/gorevler/is-plani';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

export type GorevSeviye = 'uyari' | 'sira' | 'plan' | 'bilgi';
export type GorevKaynak =
  | 'bekletme'
  | 'asi'
  | 'stok'
  | 'saglik'
  | 'tartim'
  | 'yolculuk'
  | 'planlanan'
  | 'is-plani';

export type Gorev = {
  id: string;
  seviye: GorevSeviye;
  kaynak: GorevKaynak;
  baslik: string;
  aciklama: string;
  href: string;
  cta: string;
  /** YYYY-MM-DD — planlı gün (yoksa bugün/acil) */
  tarih?: string;
  tamamlanabilir?: boolean;
  tamam?: boolean;
};

const SEVIYE_SIRASI: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };

export function bugunTarih(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Öncelik (acil → sırada → planlı) · aynı seviyede en yakın tarih önce */
export function gorevleriSirala(gorevler: Gorev[]): Gorev[] {
  const bugun = bugunTarih();
  return [...gorevler].sort((a, b) => {
    const ds = SEVIYE_SIRASI[a.seviye] - SEVIYE_SIRASI[b.seviye];
    if (ds !== 0) return ds;
    return (a.tarih ?? bugun).localeCompare(b.tarih ?? bugun);
  });
}

/** Liste: "21 Eylül" — yıl yok. Detay için `yil: true`. */
export function gorevTarihMetni(tarih?: string, opts?: { yil?: boolean }): string {
  if (!tarih) return '—';
  return new Date(`${tarih}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(opts?.yil ? { year: 'numeric' as const } : {}),
  });
}

export function gorevSeviyeEtiket(seviye: GorevSeviye): string {
  if (seviye === 'uyari') return 'Acil';
  if (seviye === 'sira') return 'Sırada';
  if (seviye === 'plan') return 'Planlı';
  return 'Bilgi';
}

function tarihGunSonra(gun: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}

function kalanGun(recordedAt: string, withdrawalDays: number): number {
  const bitis = new Date(recordedAt).getTime() + withdrawalDays * 86400000;
  return Math.max(0, Math.ceil((bitis - Date.now()) / 86400000));
}

function dusukTakviyeler(items: StockItem[]): StockItem[] {
  return items.filter((i) => i.type === 'supplement' && i.quantity <= i.minQuantity);
}

function sktYakinTakviyeler(items: StockItem[], gun = 60): StockItem[] {
  const limit = Date.now() + gun * 86400000;
  return items.filter(
    (i) =>
      i.type === 'supplement' &&
      i.expiryDate &&
      new Date(i.expiryDate).getTime() <= limit &&
      new Date(i.expiryDate).getTime() >= Date.now()
  );
}

/** Mod takviye planı — bekleyen aşı (21g) + tartım (15g) görevleri */
async function modPlanGorevleri(): Promise<Gorev[]> {
  const modId = await getAktifModId();
  const plan = await aktifPlanOku(modId);
  if (!plan) return [];

  const bugun = new Date().toISOString().slice(0, 10);
  const out: Gorev[] = [];

  for (const k of plan.kalemler) {
    if (k.tip !== 'asi' && k.tip !== 'parazit' && k.tip !== 'tartim') continue;
    const bekleyen = plan.durumlar.filter(
      (d) => d.tip === k.tip && d.programId === k.programId && !d.yapildi,
    );
    if (bekleyen.length === 0) continue;

    const tarihler = bekleyen
      .map((d) => d.planlananAt?.slice(0, 10))
      .filter((t): t is string => !!t)
      .sort();
    // Tartımda planlanan yoksa bugün say
    const tarih = tarihler[0] ?? (k.tip === 'tartim' ? bugun : plan.tarih.slice(0, 10));
    const kalan = Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
    const gecikti = kalan <= 0;
    const yakin = !gecikti && kalan <= 7;

    if (k.tip === 'tartim') {
      out.push({
        id: `mod-plan-tartim-${k.programId}`,
        seviye: gecikti || yakin ? 'sira' : 'plan',
        kaynak: 'tartim',
        baslik: k.ad,
        aciklama: `${bekleyen.length} kuzu · ${
          gecikti ? 'tartım zamanı' : `${kalan} gün sonra · ${tarih}`
        }`,
        href: '/(tabs)/veteriner',
        cta: 'Plana bak',
        tarih,
      });
    }
  }

  return out;
}

async function yolculukGorevi(): Promise<Gorev | null> {
  const modId = await getAktifModId();
  const mod = getMod(modId);
  if (modId === 'mod1') {
    const m = await getMod1BirlesikIlerleme();
    const sonraki = sonrakiAcikAdim(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod2') {
    const m = await getMod2BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod2(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod3') {
    const m = await getMod3BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod3(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod4') {
    const m = await getMod4BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod4(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  return null;
}

function isPlaniGorevKaynak(tur: IsPlaniTur): GorevKaynak {
  if (tur === 'tartim') return 'tartim';
  if (tur === 'kirpim') return 'saglik';
  return 'is-plani';
}

function isPlaniCta(tur: IsPlaniTur): string {
  if (tur === 'kuzu-alim') return 'Kuzu ekle';
  if (tur === 'tartim') return 'Tartıma git';
  if (tur === 'kuzu-satim') return 'Satış kaydı';
  return 'Aç';
}

/**
 * Tüm planlanan / bekleyen görevler — limit yok.
 * Kaynaklar: bekletme, aşı, stok, sağlık, tartım, yolculuk adımı, elle planlanan.
 */
export async function getGorevler(): Promise<Gorev[]> {
  const out: Gorev[] = [];

  const withdrawals = await getActiveWithdrawals();
  const bugun = bugunTarih();
  for (const w of withdrawals) {
    const gun = kalanGun(w.recordedAt, w.withdrawalDays);
    const bitis = tarihGunSonra(w.withdrawalDays, new Date(w.recordedAt));
    out.push({
      id: `bekletme-${w.animalId}`,
      seviye: 'uyari',
      kaynak: 'bekletme',
      baslik: 'Bekletme',
      aciklama: `${hayvanAnaEtiket({ earTag: w.earTag ?? '', sirtNo: (w as { sirtNo?: string | null }).sirtNo ?? null, gehisId: null, name: '' })} · ${w.medicine} · ${gun} gün kaldı`,
      href: `/hayvan/${w.animalId}/saglik`,
      cta: 'Kayıt aç',
      tarih: bitis,
    });
  }

  const animals = await getAnimals();
  const health = await getAllHealthRecordsForAsi();
  const stock = await getStockItems();
  const asiDurum = hesaplaAsiStokDurumu(animals, health, stock);

  for (const u of asiStokUyarilari(asiDurum)) {
    const stokMu = u.baslik.includes('stok') || u.baslik.includes('SKT');
    out.push({
      id: u.id,
      seviye: u.seviye === 'uyari' ? 'uyari' : 'sira',
      kaynak: stokMu ? 'stok' : 'asi',
      baslik: u.baslik,
      aciklama: u.aciklama,
      href: stokMu ? '/(tabs)/stok' : '/(tabs)/saglik',
      cta: stokMu ? 'Stoka git' : 'Aşıya bak',
      tarih: bugun,
    });
  }

  out.push(...(await asiTopluGorevleri()));

  const dusukTakviye = dusukTakviyeler(stock);
  const sktTakviye = sktYakinTakviyeler(stock);
  if (dusukTakviye.length > 0) {
    for (const item of dusukTakviye.slice(0, 10)) {
      out.push({
        id: `takviye-stok-${item.id}`,
        seviye: 'uyari',
        kaynak: 'stok',
        baslik: 'Takviye stoğu düşük',
        aciklama: `${item.name} · ${item.quantity} ${item.unit} (min ${item.minQuantity})`,
        href: '/(tabs)/stok',
        cta: 'Stoka git',
        tarih: bugun,
      });
    }
  } else if (sktTakviye.length > 0) {
    for (const item of sktTakviye.slice(0, 10)) {
      out.push({
        id: `takviye-skt-${item.id}`,
        seviye: 'sira',
        kaynak: 'stok',
        baslik: 'Takviye SKT yakın',
        aciklama: `${item.name} · son kullanma yaklaşıyor`,
        href: '/(tabs)/stok',
        cta: 'Stoka git',
        tarih: item.expiryDate ?? bugun,
      });
    }
  }

  const asiStokAdlari = new Set(
    asiDurum.map((d) => d.stokAdi?.toLocaleLowerCase('tr-TR')).filter(Boolean) as string[]
  );
  const takviyeIds = new Set(dusukTakviye.map((i) => i.id));
  const lowStock = (await getLowStockItems()).filter(
    (i) =>
      !(i.type === 'vaccine' && asiStokAdlari.has(i.name.toLocaleLowerCase('tr-TR'))) &&
      !takviyeIds.has(i.id)
  );
  for (const item of lowStock.slice(0, 15)) {
    out.push({
      id: `stok-${item.id}`,
      seviye: 'uyari',
      kaynak: 'stok',
      baslik: 'Düşük stok',
      aciklama: `${item.name} · ${item.quantity} ${item.unit} (min ${item.minQuantity})`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
      tarih: bugun,
    });
  }

  const hasta = animals.filter((a) => a.status === 'sick');
  for (const h of hasta.slice(0, 15)) {
    out.push({
      id: `saglik-hasta-${h.id}`,
      seviye: 'sira',
      kaynak: 'saglik',
      baslik: 'Sağlık takibi',
      aciklama: `${hayvanAnaEtiket(h)} hasta — tedavi / kontrol`,
      href: `/hayvan/${h.id}/saglik`,
      cta: 'Kayıt aç',
      tarih: bugun,
    });
  }

  const aktifHayvanlar = animals.filter((a) => a.status !== 'sold' && a.status !== 'dead');
  for (const a of aktifHayvanlar.slice(0, 50)) {
    const w = await getLatestWeight(a.id);
    if (w == null) {
      out.push({
        id: `tartim-hayvan-${a.id}`,
        seviye: 'sira',
        kaynak: 'tartim',
        baslik: 'Tartım yok',
        aciklama: `${hayvanAnaEtiket(a)} · henüz tartım kaydı yok`,
        href: `/hayvan/${a.id}/kilo`,
        cta: 'Tartım gir',
        tarih: bugun,
      });
    }
  }

  const yol = await yolculukGorevi();
  if (yol) out.push({ ...yol, tarih: yol.tarih ?? bugun });

  out.push(...(await modPlanGorevleri()));

  for (const ip of await getIsPlaniKayitlari()) {
    const meta = IS_PLANI_META[ip.tur];
    const kalan = isPlaniKalanGun(ip.tarih, bugun);
    let seviye: GorevSeviye = 'plan';
    if (ip.tarih < bugun) seviye = 'uyari';
    else if (ip.tarih === bugun) seviye = 'sira';

    const zaman =
      kalan > 0
        ? `${kalan} gün sonra`
        : kalan === 0
          ? 'Bugün'
          : `${Math.abs(kalan)} gün gecikti`;

    out.push({
      id: `is-plani-${ip.id}`,
      seviye,
      kaynak: isPlaniGorevKaynak(ip.tur),
      baslik: `${meta.label}`,
      aciklama: `${zaman} · ${isPlaniAciklama(ip)}`,
      href: meta.href,
      cta: isPlaniCta(ip.tur),
      tarih: ip.tarih,
      tamamlanabilir: true,
    });
  }

  for (const p of await getPlanlananGorevler()) {
    if (p.tamam) continue;
    out.push({
      id: `plan-${p.id}`,
      seviye: p.tarih <= bugun ? 'sira' : 'plan',
      kaynak: 'planlanan',
      baslik: p.baslik,
      aciklama: p.aciklama || (p.tarih > bugun ? `Plan: ${p.tarih}` : `Bugün · ${p.tarih}`),
      href: p.href,
      cta: 'Aç',
      tarih: p.tarih,
      tamamlanabilir: true,
      tamam: false,
    });
  }

  return gorevleriSirala(out);
}

const BUGUN_DISLA = (id: string) =>
  id.startsWith('asi-ozet-') ||
  id.startsWith('tartim-hayvan-') ||
  id.startsWith('bekletme-') ||
  id.startsWith('mod-plan-tartim-');

/** Bugün kartı — günlük görevler (gelecek planlar hariç) */
export async function getBugunGorevleri(limit = 3): Promise<Gorev[]> {
  const bugun = new Date().toISOString().slice(0, 10);
  const ham = await getGorevler();

  const gunluk = (g: Gorev) => g.seviye !== 'plan' && !(g.tarih && g.tarih > bugun);

  const ozetler: Gorev[] = [];
  const asiN = ham.filter(
    (g) => g.kaynak === 'asi' && g.id.startsWith('asi-ozet-') && gunluk(g),
  ).length;
  if (asiN) {
    ozetler.push({
      id: 'bugun-asi-ozet',
      seviye: 'uyari',
      kaynak: 'asi',
      baslik: 'Aşı',
      aciklama: `${asiN} aşı · bekleyen kuzu grupları`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }
  const tartimN = ham.filter(
    (g) =>
      g.kaynak === 'tartim' &&
      (g.id.startsWith('tartim-hayvan-') || g.id.startsWith('mod-plan-tartim-')) &&
      gunluk(g),
  ).length;
  if (tartimN) {
    ozetler.push({
      id: 'bugun-tartim-ozet',
      seviye: 'sira',
      kaynak: 'tartim',
      baslik: 'Tartım',
      aciklama: `${tartimN} kalem · tartım bekliyor`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }
  const stokN = ham.filter((g) => g.kaynak === 'stok' && gunluk(g)).length;
  if (stokN) {
    ozetler.push({
      id: 'bugun-stok-ozet',
      seviye: 'uyari',
      kaynak: 'stok',
      baslik: 'Stok',
      aciklama: `${stokN} kalem · düşük veya SKT yakın`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }
  const bekN = ham.filter((g) => g.kaynak === 'bekletme' && gunluk(g)).length;
  if (bekN) {
    ozetler.push({
      id: 'bugun-bekletme-ozet',
      seviye: 'uyari',
      kaynak: 'bekletme',
      baslik: 'Bekletme',
      aciklama: `${bekN} hayvan · ilaç bekletmesi devam ediyor`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }
  const isPlaniN = ham.filter((g) => g.id.startsWith('is-plani-') && gunluk(g)).length;
  if (isPlaniN) {
    ozetler.push({
      id: 'bugun-is-plani-ozet',
      seviye: 'sira',
      kaynak: 'is-plani',
      baslik: 'Planlanan iş',
      aciklama: `${isPlaniN} iş · bugün veya gecikmiş`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }

  const filtered = ham.filter((g) => {
    if (!gunluk(g)) return false;
    if (BUGUN_DISLA(g.id)) return false;
    return true;
  });

  const birlesik = [...ozetler, ...filtered];

  if (birlesik.length === 0) {
    return [
      {
        id: 'bos',
        seviye: 'bilgi',
        kaynak: 'planlanan',
        baslik: 'Bugün acil iş yok',
        aciklama: 'Planlanan görev ekleyebilir veya tüm listeye bakabilirsiniz.',
        href: '/gorevler',
        cta: 'Görevlere git',
        tarih: bugun,
      },
    ];
  }

  return gorevleriSirala(birlesik).slice(0, limit);
}

/** Ana sayfa özeti — en fazla 3 görev (eski ad; Bugün ile aynı) */
export async function getGorevOzeti(limit = 3): Promise<Gorev[]> {
  return getBugunGorevleri(limit);
}
