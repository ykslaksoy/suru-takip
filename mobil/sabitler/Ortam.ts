/**
 * Uygulama ortamı — EXPO_PUBLIC_ORTAM ile kontrol edilir.
 * gelistirme: demo seed açık · pilot/uretim: boş kurulum, yedek zorunlu.
 */

export type AppOrtam = 'gelistirme' | 'pilot' | 'uretim';

function ortamDegeri(): string {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ORTAM) {
    return String(process.env.EXPO_PUBLIC_ORTAM).trim().toLowerCase();
  }
  return 'gelistirme';
}

export function appOrtam(): AppOrtam {
  const v = ortamDegeri();
  if (v === 'uretim' || v === 'production' || v === 'prod') return 'uretim';
  if (v === 'pilot' || v === 'beta') return 'pilot';
  return 'gelistirme';
}

export function appOrtamEtiketi(): string {
  const map: Record<AppOrtam, string> = {
    gelistirme: 'Geliştirme',
    pilot: 'Pilot',
    uretim: 'Üretim',
  };
  return map[appOrtam()];
}

/** İlk açılışta otomatik demo verisi (Padok A/B/C dahil) */
export function demoSeedOtomatik(): boolean {
  return appOrtam() === 'gelistirme';
}

/** Pilot / üretimde işletme adı ve KVKK onayı beklenir */
export function isletmeProfilZorunlu(): boolean {
  return appOrtam() !== 'gelistirme';
}

export function bulutSenkronAktif(): boolean {
  const url =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || '';
  return String(url).trim().length > 0;
}
