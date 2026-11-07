/** Kullanıcı arayüzünde görünen sabit metinler — yalnızca Türkçe. */

import {
  fcrDegerMetni,
  gcaaDegerMetni,
  metrikBaslik,
  metrikTooltip,
  metrikYetersizVeri,
  PERFORMANS_METRIK,
} from '@/kaynak/kilo/performans-metrik-etiket';

export const BETA_KATEGORILER = {
  general: 'Genel',
  bug: 'Hata bildirimi',
  feature: 'Özellik isteği',
} as const;

export type BetaKategori = keyof typeof BETA_KATEGORILER;

/** Kısa terim + Türkçe açıklama — arayüzde birlikte gösterilir. */
export const TERIMLER = {
  ADG: {
    kisa: PERFORMANS_METRIK.GCAA.kisa,
    aciklama: `${PERFORMANS_METRIK.GCAA.baslik}, ${PERFORMANS_METRIK.GCAA.birim}`,
  },
  FCR: {
    kisa: PERFORMANS_METRIK.FCR.kisa,
    aciklama: `${PERFORMANS_METRIK.FCR.baslik}, ${PERFORMANS_METRIK.FCR.birim}`,
  },
  T1: { kisa: 'T1', aciklama: 'ilk tartım' },
  BCS: { kisa: 'BCS', aciklama: 'vücut kondisyon skoru' },
  SKT: { kisa: 'SKT', aciklama: 'son kullanma tarihi' },
  GEKIS: { kisa: 'GEKİS', aciklama: 'elektronik hayvan kimlik sistemi' },
  TURKVET: { kisa: 'TÜRKVET', aciklama: 'ulusal hayvan tanımlama ve kayıt sistemi' },
  JSON: { kisa: 'JSON', aciklama: 'veri dosyası formatı' },
} as const;

export type TerimAnahtar = keyof typeof TERIMLER;

/** Örn. "Yemden yararlanma oranı (FCR)" */
export function terim(key: TerimAnahtar): string {
  if (key === 'FCR') return metrikBaslik('FCR');
  if (key === 'ADG') return metrikBaslik('GCAA');
  const t = TERIMLER[key];
  return `${t.kisa} (${t.aciklama})`;
}

/** Yalnızca kısa ad — performans için GCAA/FCR */
export function terimKisa(key: TerimAnahtar): string {
  if (key === 'ADG') return PERFORMANS_METRIK.GCAA.kisa;
  if (key === 'FCR') return PERFORMANS_METRIK.FCR.kisa;
  return TERIMLER[key].kisa;
}

/** @deprecated ADG — gcaaDegerMetni kullanın */
export function adgDeger(gramGun: number): string {
  return gcaaDegerMetni(gramGun);
}

export function fcrDeger(orani: number): string {
  return fcrDegerMetni(orani);
}

export { metrikBaslik, metrikTooltip, metrikYetersizVeri, gcaaDegerMetni, fcrDegerMetni };

/** Yem (kg/gün) ile GCAA (g/gün) karışmasın diye tablo satırı */
export type YemAdgTabloSatiri = {
  gosterge: string;
  deger: string;
  birim: string;
  not: string;
  vurgu?: boolean;
};

/** Performans ekranı — günlük yem + GCAA + karşılaştırmalı örnekler (notlu). */
export function yemAdgPerformansTablosu(opts: {
  gunlukYemKg?: number | null;
  adgGram?: number | null;
}): YemAdgTabloSatiri[] {
  const satirlar: YemAdgTabloSatiri[] = [];

  satirlar.push({
    gosterge: 'Günlük yem',
    deger: opts.gunlukYemKg != null ? opts.gunlukYemKg.toLocaleString('tr-TR') : '—',
    birim: 'kg/gün (as-fed)',
    not: 'Günde verilen yem miktarı. Günlük canlı ağırlık artışı (GCAA) değildir.',
    vurgu: opts.gunlukYemKg != null,
  });

  satirlar.push({
    gosterge: metrikBaslik('GCAA'),
    deger: opts.adgGram != null ? gcaaDegerMetni(opts.adgGram) : '—',
    birim: PERFORMANS_METRIK.GCAA.birim,
    not: metrikTooltip('GCAA'),
    vurgu: opts.adgGram != null,
  });

  satirlar.push({
    gosterge: `Örnek · ${metrikBaslik('FCR')}`,
    deger: '5,5',
    birim: PERFORMANS_METRIK.FCR.birim,
    not: 'Karşılaştırılabilir artışta ~145 g/gün GCAA ile uyumlu örnek (tahmin değil).',
  });

  satirlar.push({
    gosterge: 'Örnek · yem',
    deger: '0,8',
    birim: 'kg/gün yem (as-fed)',
    not: 'Günlük yem kg/gün değeri — canlı ağırlık artışı ile karıştırılmaz.',
  });

  return satirlar;
}

export const UI_KURAL =
  'Tüm ekran metinleri Türkçe olmalıdır. Performans metrikleri: Yemden yararlanma oranı (FCR) ve Günlük canlı ağırlık artışı (GCAA, g/gün).';
