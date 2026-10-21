/** Turnstile ortam bayrakları — React Native bağımlılığı yok (testler için). */

export const OTP_GONDER_BEKLEME_MS = 60_000;

function envSatir(...anahtarlar: string[]): string {
  for (const k of anahtarlar) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

export function turnstileSiteKey(): string | null {
  const k = envSatir('EXPO_PUBLIC_TURNSTILE_SITE_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  return k || null;
}

export function turnstileKorumasiAktif(): boolean {
  return turnstileSiteKey() !== null;
}

export function otpBeklemeKalanMs(sonGonderim: number | null, simdi = Date.now()): number {
  if (!sonGonderim) return 0;
  return Math.max(0, OTP_GONDER_BEKLEME_MS - (simdi - sonGonderim));
}
