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
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hatirlatma';
import { getAktifModId, getMod } from '@/sabitler/Modlar';
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
  for (const w of withdrawals) {
    const gun = kalanGun(w.recordedAt, w.withdrawalDays);
    out.push({
      id: `bekletme-${w.animalId}`,
      seviye: 'uyari',
      kaynak: 'bekletme',
      baslik: 'Bekletme',
      aciklama: `${hayvanAnaEtiket({ earTag: w.earTag ?? '', sirtNo: (w as { sirtNo?: string | null }).sirtNo ?? null, gehisId: null, name: '' })} · ${w.medicine} · ${gun} gün kaldı`,
      href: `/hayvan/${w.animalId}/saglik`,
      cta: 'Kayıt aç',
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
    });
  }

  for (const s of asiBuHaftaListesi(asiDurum).slice(0, 30)) {
    // Özet uyarılar zaten var; hayvan satırlarını ayrı görev olarak ekle
    out.push({
      id: `asi-hayvan-${s.programId}-${s.animalId}`,
      seviye: s.durum === 'yapilacak' ? 'uyari' : 'sira',
      kaynak: 'asi',
      baslik: `${s.koruma} (${s.asiAdi}) ${s.mlEtiket}`,
      aciklama:
        s.durum === 'yapilacak'
          ? `${s.etiket || s.earTag || 'Hayvan'} · aşı zamanı geldi`
          : `${s.etiket || s.earTag || 'Hayvan'} · ${s.kalanGun ?? '?'} gün içinde`,
      href: `/hayvan/${s.animalId}/saglik`,
      cta: 'Kayıt aç',
    });
  }

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
      });
    }
  }

  const yol = await yolculukGorevi();
  if (yol) out.push(yol);

  const bugun = new Date().toISOString().slice(0, 10);
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

  // Öncelik: uyari → sira → plan → bilgi; aynı seviyede tarih
  const sira: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };
  out.sort((a, b) => {
    const ds = sira[a.seviye] - sira[b.seviye];
    if (ds !== 0) return ds;
    return (a.tarih ?? bugun).localeCompare(b.tarih ?? bugun);
  });

  return out;
}

const BUGUN_DISLA = (id: string) =>
  id.startsWith('asi-hayvan-') || id.startsWith('tartim-hayvan-') || id.startsWith('bekletme-');

/** Bugün kartı — günlük görevler (gelecek planlar hariç) */
export async function getBugunGorevleri(limit = 3): Promise<Gorev[]> {
  const bugun = new Date().toISOString().slice(0, 10);
  const ham = await getGorevler();

  const gunluk = (g: Gorev) => g.seviye !== 'plan' && !(g.tarih && g.tarih > bugun);

  const ozetler: Gorev[] = [];
  const asiN = ham.filter((g) => g.kaynak === 'asi' && g.id.startsWith('asi-hayvan-') && gunluk(g)).length;
  if (asiN) {
    ozetler.push({
      id: 'bugun-asi-ozet',
      seviye: 'uyari',
      kaynak: 'asi',
      baslik: 'Aşı',
      aciklama: `${asiN} hayvan · yapılacak veya yaklaşan`,
      href: '/gorevler',
      cta: 'Görevlere bak',
    });
  }
  const tartimN = ham.filter((g) => g.kaynak === 'tartim' && gunluk(g)).length;
  if (tartimN) {
    ozetler.push({
      id: 'bugun-tartim-ozet',
      seviye: 'sira',
      kaynak: 'tartim',
      baslik: 'Tartım',
      aciklama: `${tartimN} hayvan · tartım kaydı yok`,
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
  const sira: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };
  birlesik.sort((a, b) => {
    const ds = sira[a.seviye] - sira[b.seviye];
    if (ds !== 0) return ds;
    return (a.tarih ?? bugun).localeCompare(b.tarih ?? bugun);
  });

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
      },
    ];
  }

  return birlesik.slice(0, limit);
}

/** Ana sayfa özeti — en fazla 3 görev (eski ad; Bugün ile aynı) */
export async function getGorevOzeti(limit = 3): Promise<Gorev[]> {
  return getBugunGorevleri(limit);
}
