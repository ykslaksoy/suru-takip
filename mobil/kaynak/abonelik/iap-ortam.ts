/**
 * IAP ortam tespiti — AsyncStorage bağımlılığı yok.
 */

export type IapOrtam = 'simulasyon' | 'magaza';

export function iapOrtam(): IapOrtam {
  const key =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_KEY) || '';
  return String(key).trim() ? 'magaza' : 'simulasyon';
}

export function iapOrtamAciklama(): string {
  return iapOrtam() === 'magaza'
    ? 'Mağaza anahtarı tanımlı — gerçek IAP denenebilir.'
    : 'Simülasyon modu — App Store / Play Store anahtarı yok (EXPO_PUBLIC_REVENUECAT_KEY).';
}
