/**
 * Besi Yönetimi — maliyet kalemleri (taslak). Gerçek muhasebeyi değiştirmez.
 */
import type { MaliyetSinifi } from '@/kaynak/maliyet/dongu-maliyet-tipler';
import { aylikAdimAySayisi } from '@/kaynak/maliyet/dongu-ekonomi-hesap';

export type EkonomiKalemKodu =
  | 'alis'
  | 'nakliye'
  | 'yem'
  | 'coban'
  | 'kira'
  | 'su_elektrik'
  | 'yatak'
  | 'veteriner'
  | 'sermaye_ekipman'
  | 'diger';

export const EKONOMI_KALEM_SABLON: { kod: EkonomiKalemKodu; etiket: string; sinif: MaliyetSinifi }[] = [
  { kod: 'alis', etiket: 'Kuzu alış', sinif: 'alis_sabit' },
  { kod: 'nakliye', etiket: 'Nakliye', sinif: 'dongu_sabit' },
  { kod: 'yem', etiket: 'Yem', sinif: 'gunluk_degisken_bas' },
  { kod: 'coban', etiket: 'Çoban / işçilik', sinif: 'aylik_adim' },
  { kod: 'kira', etiket: 'Kira / bina', sinif: 'aylik_adim' },
  { kod: 'su_elektrik', etiket: 'Su / elektrik', sinif: 'gunluk_degisken_bas' },
  { kod: 'yatak', etiket: 'Yatak / straw', sinif: 'gunluk_degisken_bas' },
  { kod: 'veteriner', etiket: 'Veteriner / ilaç', sinif: 'dongu_sabit' },
  { kod: 'sermaye_ekipman', etiket: 'Sermaye / ekipman (opsiyonel)', sinif: 'dongu_sabit' },
  { kod: 'diger', etiket: 'Diğer', sinif: 'dongu_sabit' },
];

export type AlisFiyatBaz = 'basina' | 'canli_kg' | 'parti_toplam';

export type KalemDegerDurumu = 'bilinmiyor' | 'sifir' | 'tutar';

export type KalemKaynakEtiket = 'projeksiyon' | 'gercek_stok' | 'gercek_parti_maliyet';

/** Stok/parti ile çift sayımı engellemek için */
export type CiftSayimAnahtar = 'parti_yem_stok' | 'parti_ilac_stok' | 'parti_alis_kayit';

export type OdemeSekli = 'tek' | 'gunluk_bas' | 'aylik_adim' | 'paylasimli_bas_gun';

export type BesiEkonomiKalem = {
  id: string;
  kod: EkonomiKalemKodu;
  etiket: string;
  sinif: MaliyetSinifi;
  kaynak: KalemKaynakEtiket;
  degerDurumu: KalemDegerDurumu;
  odeme: OdemeSekli;
  /** ₺/baş, ₺/kg canlı, ₺ toplam parti, ₺/gün/baş, ₺/ay, vb. */
  birimTutar: number | null;
  alisBaz?: AlisFiyatBaz;
  /** Alış kg canlı (canli_kg bazında) */
  girisCanliKg?: number | null;
  /** Aylık adım */
  minSozlesmeAy?: number;
  /** Paylaşımlı payda baş×gün */
  kapasiteBasGun?: number | null;
  paylasimToplam?: number | null;
  ciftSayimAnahtar?: CiftSayimAnahtar;
  not?: string;
};

export type BesiEkonomiBaglam = {
  basSayisi: number;
  toplamGun: number;
  girisCanliKg: number | null;
};

export function alisBasTutarHesap(
  k: BesiEkonomiKalem,
  ctx: BesiEkonomiBaglam,
): { tutar: number | null; eksik: string[] } {
  const eksik: string[] = [];
  if (k.degerDurumu === 'bilinmiyor') return { tutar: null, eksik: ['Alış fiyatı girilmedi'] };
  if (k.degerDurumu === 'sifir') return { tutar: 0, eksik: [] };
  const birim = k.birimTutar;
  if (birim == null || birim < 0) return { tutar: null, eksik: ['Alış tutarı geçersiz'] };
  const baz = k.alisBaz ?? 'basina';
  if (baz === 'basina') return { tutar: Math.round(birim * ctx.basSayisi), eksik: [] };
  if (baz === 'parti_toplam') return { tutar: Math.round(birim), eksik: [] };
  const kg = k.girisCanliKg ?? ctx.girisCanliKg;
  if (kg == null || kg <= 0) return { tutar: null, eksik: ['Alış kg canlı gerekli'] };
  return { tutar: Math.round(birim * kg * ctx.basSayisi), eksik: [] };
}

export function kalemToplamTutar(
  k: BesiEkonomiKalem,
  ctx: BesiEkonomiBaglam,
  opts?: { haricCiftSayim: Set<CiftSayimAnahtar> },
): { tutar: number | null; eksik: string[]; atlandi: boolean; etiket: string } {
  if (k.ciftSayimAnahtar && opts?.haricCiftSayim.has(k.ciftSayimAnahtar)) {
    return { tutar: null, eksik: [], atlandi: true, etiket: `${k.etiket} (gerçek kayıt — projeksiyon atlandı)` };
  }
  if (k.degerDurumu === 'bilinmiyor') return { tutar: null, eksik: [`${k.etiket}: fiyat bilinmiyor`], atlandi: false, etiket: k.etiket };
  if (k.degerDurumu === 'sifir') return { tutar: 0, eksik: [], atlandi: false, etiket: `${k.etiket} (0 ₺)` };

  if (k.kod === 'alis') {
    const a = alisBasTutarHesap(k, ctx);
    return { tutar: a.tutar, eksik: a.eksik, atlandi: false, etiket: k.etiket };
  }

  const birim = k.birimTutar;
  if (birim == null || birim < 0) return { tutar: null, eksik: [`${k.etiket}: tutar geçersiz`], atlandi: false, etiket: k.etiket };

  if (k.odeme === 'tek') {
    return { tutar: Math.round(birim), eksik: [], atlandi: false, etiket: k.etiket };
  }
  if (k.odeme === 'gunluk_bas') {
    return { tutar: Math.round(birim * ctx.basSayisi * ctx.toplamGun), eksik: [], atlandi: false, etiket: k.etiket };
  }
  if (k.odeme === 'aylik_adim') {
    const ay = aylikAdimAySayisi(ctx.toplamGun, k.minSozlesmeAy ?? 1);
    return { tutar: Math.round(ay * birim), eksik: [], atlandi: false, etiket: `${k.etiket} (${ay} ay)` };
  }
  if (k.odeme === 'paylasimli_bas_gun') {
    const kap = k.kapasiteBasGun ?? k.paylasimToplam;
    if (!k.paylasimToplam || !kap || kap <= 0) {
      return { tutar: null, eksik: [`${k.etiket}: paylaşım paydası eksik`], atlandi: false, etiket: k.etiket };
    }
    const pay = (ctx.basSayisi * ctx.toplamGun * k.paylasimToplam) / kap;
    return { tutar: Math.round(pay), eksik: [], atlandi: false, etiket: k.etiket };
  }
  return { tutar: null, eksik: [`${k.etiket}: ödeme şekli tanımsız`], atlandi: false, etiket: k.etiket };
}

export function varsayilanKalemlerBos(): BesiEkonomiKalem[] {
  return EKONOMI_KALEM_SABLON.map((s, i) => ({
    id: `k-${s.kod}`,
    kod: s.kod,
    etiket: s.etiket,
    sinif: s.sinif,
    kaynak: 'projeksiyon' as const,
    degerDurumu: 'bilinmiyor' as const,
    odeme:
      s.kod === 'alis' || s.kod === 'nakliye' || s.kod === 'veteriner' || s.kod === 'sermaye_ekipman' || s.kod === 'diger'
        ? ('tek' as const)
        : s.kod === 'coban' || s.kod === 'kira'
          ? ('aylik_adim' as const)
          : ('gunluk_bas' as const),
    birimTutar: null,
    alisBaz: s.kod === 'alis' ? 'basina' : undefined,
    minSozlesmeAy: s.kod === 'kira' ? 3 : s.kod === 'coban' ? 1 : undefined,
    ciftSayimAnahtar:
      s.kod === 'yem' ? 'parti_yem_stok' : s.kod === 'veteriner' ? 'parti_ilac_stok' : s.kod === 'alis' ? 'parti_alis_kayit' : undefined,
  }));
}
