/**
 * Bulut senkron özellik bayrağı. EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
 * (Vercel Supabase entegrasyonu bu adlarla otomatik ekler) tanımlı değilse bulut tamamen kapalıdır; uygulama yalnız yerel çalışır.
 */
export type BulutAyar = { url: string; anonKey: string };

export function bulutAyar(): BulutAyar | null {
  // Expo yalnızca doğrudan process.env.EXPO_PUBLIC_* erişimini derlemeye gömer.
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anonKey = String(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  if (!url || !anonKey || !/^https:\/\//.test(url)) return null;
  return { url, anonKey };
}

export function bulutAcik(): boolean {
  return bulutAyar() !== null;
}
