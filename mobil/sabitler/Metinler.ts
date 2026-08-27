/** Kullanıcı arayüzünde görünen sabit metinler — yalnızca Türkçe. */

export const BETA_KATEGORILER = {
  general: 'Genel',
  bug: 'Hata bildirimi',
  feature: 'Özellik isteği',
} as const;

export type BetaKategori = keyof typeof BETA_KATEGORILER;

export const UI_KURAL =
  'Tüm ekran metinleri, uyarılar, yer tutucular ve buton etiketleri Türkçe olmalıdır. Teknik kısaltmalar (TÜRKVET, GEKİS) ve marka dereceleri (Fit, Sportmen) istisnadır.';
