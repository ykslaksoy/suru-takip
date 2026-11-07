import type { AdgSonuc } from '@/kaynak/kilo/adg';
import type { FcrSonuc } from '@/kaynak/kilo/fcr-hesap';
import type { CozulmusPerformansEsik } from '@/kaynak/kilo/performans-esik-oncelik';
import { FCR_BIRIM, GCAA_BIRIM } from '@/kaynak/kilo/performans-esik-tipler';

export const PERFORMANS_ESIK_KONTROL_LISTESI = [
  'Tartım tarihleri ve kiloları kayıtlarla karşılaştırın.',
  'Yem ve su erişimini (kapasite, rekabet, padok) kontrol edin.',
  'İştah ve dışkı gözlemini not edin; genel durumu izleyin.',
  'Belirti uzun sürerse veteriner/hekim değerlendirmesi planlayın.',
] as const;

export type PerformansEsikGcaaDurum =
  | { sonuc: 'yetersiz_veri'; neden: string }
  | { sonuc: 'esik_yok' }
  | { sonuc: 'hedef_icinde'; gcaaGram: number; hedefGram: number; kaynak: string }
  | { sonuc: 'hedef_alti'; gcaaGram: number; hedefGram: number; kaynak: string; kontrolListesi: readonly string[] };

export type PerformansEsikFcrDurum =
  | { sonuc: 'yetersiz_veri'; neden: string }
  | { sonuc: 'esik_yok' }
  | { sonuc: 'hedef_icinde'; fcr: number; hedefUst: number; kaynak: string }
  | { sonuc: 'hedef_ustu'; fcr: number; hedefUst: number; kaynak: string; kontrolListesi: readonly string[] };

export type PerformansEsikBaski = 'yok' | 'gcaa' | 'fcr' | 'ikisi';

export function performansEsikGcaaDegerlendir(
  adg: AdgSonuc,
  esik: CozulmusPerformansEsik,
): PerformansEsikGcaaDurum {
  if (esik.gcaaAltGram == null || !esik.gcaaKaynak) return { sonuc: 'esik_yok' };
  if (adg.durum !== 'hazir') {
    return { sonuc: 'yetersiz_veri', neden: adg.durum === 'yok' ? adg.neden : 'GCAA ölçülemedi' };
  }
  const hedef = esik.gcaaAltGram;
  const kaynak = esik.gcaaKaynak;
  if (adg.gramGun < hedef) {
    return {
      sonuc: 'hedef_alti',
      gcaaGram: adg.gramGun,
      hedefGram: hedef,
      kaynak,
      kontrolListesi: PERFORMANS_ESIK_KONTROL_LISTESI,
    };
  }
  return { sonuc: 'hedef_icinde', gcaaGram: adg.gramGun, hedefGram: hedef, kaynak };
}

export function performansEsikFcrDegerlendir(
  fcr: FcrSonuc,
  esik: CozulmusPerformansEsik,
): PerformansEsikFcrDurum {
  if (esik.fcrUst == null || !esik.fcrKaynak) return { sonuc: 'esik_yok' };
  if (fcr.durum !== 'hazir') {
    return { sonuc: 'yetersiz_veri', neden: fcr.durum === 'yok' ? fcr.neden : 'FCR hesaplanamadı' };
  }
  const hedef = esik.fcrUst;
  const kaynak = esik.fcrKaynak;
  const deger = fcr.hesap.fcr;
  if (deger > hedef) {
    return {
      sonuc: 'hedef_ustu',
      fcr: deger,
      hedefUst: hedef,
      kaynak,
      kontrolListesi: PERFORMANS_ESIK_KONTROL_LISTESI,
    };
  }
  return { sonuc: 'hedef_icinde', fcr: deger, hedefUst: hedef, kaynak };
}

export function performansEsikGcaaBaslik(d: PerformansEsikGcaaDurum): string | null {
  if (d.sonuc === 'hedef_alti') {
    return `GCAA çiftlik hedefinin altında (${d.gcaaGram} < ${d.hedefGram} ${GCAA_BIRIM})`;
  }
  return null;
}

export function performansEsikFcrBaslik(d: PerformansEsikFcrDurum): string | null {
  if (d.sonuc === 'hedef_ustu') {
    return `FCR çiftlik hedefinin üstünde (${d.fcr} > ${d.hedefUst} ${FCR_BIRIM})`;
  }
  return null;
}

/** Gözlem / karantina — büyüme hedefi uyarısı üretilmez. */
export function performansEsikUyumBaskiNedeni(opts: {
  gozlemPadok: boolean;
  karantinaPadok: boolean;
}): string | null {
  if (opts.gozlemPadok) return 'Gözlem ve uyum dönemi — performans hedefi karşılaştırması yapılmaz.';
  if (opts.karantinaPadok) return 'Karantina padoku — uyum dönemi; performans hedefi karşılaştırması yapılmaz.';
  return null;
}
