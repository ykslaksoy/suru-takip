/**
 * Kullanıcı kapsamlı REST senkron API (sunucu/ stub veya gelecekteki üretim API).
 * Supabase PWA yolundan bağımsız — EXPO_PUBLIC_API_URL ile açılır.
 */

function envSatir(...anahtarlar: string[]): string {
  for (const k of anahtarlar) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

/** Temel URL, sondaki slash olmadan. Tanımlı değilse null. */
export function bulutApiUrl(): string | null {
  const raw = envSatir('EXPO_PUBLIC_API_URL', 'NEXT_PUBLIC_API_URL').replace(/\/+$/, '');
  if (!raw) return null;
  if (!/^https?:\/\//.test(raw)) return null;
  return raw;
}

export function bulutApiSyncKey(): string {
  return envSatir('EXPO_PUBLIC_SYNC_API_KEY', 'NEXT_PUBLIC_SYNC_API_KEY');
}

/** Kuyruk POST yolu mevcut mu (gerçek backend olmasa da kod yolu). */
export function bulutApiSenkronHazir(): boolean {
  return bulutApiUrl() !== null;
}
