/**
 * Bulut senkron özellik bayrağı. Supabase URL + anon/publishable key
 * tanımlı değilse bulut tamamen kapalıdır; uygulama yalnız yerel çalışır.
 *
 * Vercel Supabase entegrasyonu: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (veya SUPABASE_ANON_KEY).
 * Yerel / Expo: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY.
 * Web derlemede scripts/supabase-expo-public.js EXPO_PUBLIC_* alanlarını doldurur.
 */
export const SUPERKUZU_REF = 'eferktaopilgoeetgggk';
export const SUPERARI_REF = 'ssminvxldxaqnzizbrfy';

export type BulutAyar = { url: string; anonKey: string };

/** Expo derlemesine gömülmesi için her kaynak doğrudan process.env ile okunur. */
function envSatir(...anahtarlar: string[]): string {
  for (const k of anahtarlar) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

/** Yalnız SuperKuzu projesi; SüperArı DB'si asla kullanılmaz. */
export function bulutAyarDogrula(url: string, anonKey: string): BulutAyar | null {
  if (!url || !anonKey || !/^https:\/\//.test(url)) return null;
  if (url.includes(SUPERARI_REF)) return null;
  return { url, anonKey };
}

export function bulutAyar(): BulutAyar | null {
  const url = envSatir(
    'EXPO_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
  ).replace(/\/+$/, '');
  const anonKey = envSatir(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
  );
  return bulutAyarDogrula(url, anonKey);
}

export function bulutAcik(): boolean {
  return bulutAyar() !== null;
}
