/** Kullanıcı arayüzünde görünen sabit metinler — yalnızca Türkçe. */

export const BETA_KATEGORILER = {
  general: 'Genel',
  bug: 'Hata bildirimi',
  feature: 'Özellik isteği',
} as const;

export type BetaKategori = keyof typeof BETA_KATEGORILER;

/** Kısa terim + Türkçe açıklama — arayüzde birlikte gösterilir. */
export const TERIMLER = {
  ADG: { kisa: 'ADG', aciklama: 'günlük kilo alım miktarı' },
  FCR: { kisa: 'FCR', aciklama: '1 kg et için kaç kg yem gerekir' },
  T0: { kisa: 'T0', aciklama: 'ilk tartım' },
  BCS: { kisa: 'BCS', aciklama: 'vücut kondisyon skoru' },
  SKT: { kisa: 'SKT', aciklama: 'son kullanma tarihi' },
  GEKIS: { kisa: 'GEKİS', aciklama: 'elektronik hayvan kimlik sistemi' },
  TURKVET: { kisa: 'TÜRKVET', aciklama: 'ulusal hayvan tanımlama ve kayıt sistemi' },
  JSON: { kisa: 'JSON', aciklama: 'veri dosyası formatı' },
  FIT: { kisa: 'Fit', aciklama: 'form tutuyor (derece)' },
  SPORTMEN: { kisa: 'Sportmen', aciklama: 'formda (derece)' },
} as const;

export type TerimAnahtar = keyof typeof TERIMLER;

/** Örn. "FCR (1 kg et için kaç kg yem gerekir)" */
export function terim(key: TerimAnahtar): string {
  const t = TERIMLER[key];
  return `${t.kisa} (${t.aciklama})`;
}

/** Yalnızca kısa ad — örn. "ADG" */
export function terimKisa(key: TerimAnahtar): string {
  return TERIMLER[key].kisa;
}

/** ADG değer metni — örn. "+250 g/gün · 0,25 kg/gün" */
export function adgDeger(gramGun: number): string {
  const kgGun = Math.round((gramGun / 1000) * 1000) / 1000;
  return `+${gramGun} g/gün · ${kgGun.toLocaleString('tr-TR')} kg/gün`;
}

/** FCR değer metni — örn. "4,2 kg yem / 1 kg artış" */
export function fcrDeger(orani: number): string {
  return `${orani.toLocaleString('tr-TR')} kg yem / 1 kg artış`;
}

export const UI_KURAL =
  'Tüm ekran metinleri Türkçe olmalıdır. Kısa terimler (ADG, FCR, T0, SKT vb.) kısaltma + parantez içinde açıklama ile gösterilir.';
