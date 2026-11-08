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

/** Yalnız SuperKuzu projesi; SüperArı DB'si asla kullanılmaz. */
export function bulutAyarDogrula(url: string, anonKey: string): BulutAyar | null {
  if (!url || !anonKey || !/^https:\/\//.test(url)) return null;
  if (url.includes(SUPERARI_REF)) return null;
  return { url, anonKey };
}

/**
 * Metro/Expo web: yalnızca sabit EXPO_PUBLIC_* erişimleri derleme zamanında gömülür.
 * Dinamik process.env[değişken] döngüsü tarayıcıda boş kalır — kullanılmaz.
 */
let ortamDosyasi: BulutAyar | null | undefined;

function gomuluAyar(): BulutAyar | null {
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(
    /\/+$/,
    '',
  );
  const anonKey = String(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      '',
  ).trim();
  return bulutAyarDogrula(url, anonKey);
}

/** Web: Vercel build JSON (/bulut-ortam.json). Native/dev: EXPO_PUBLIC gömümü. */
export async function bulutOrtamYukle(): Promise<void> {
  if (ortamDosyasi !== undefined) return;
  const g = gomuluAyar();
  if (g) {
    ortamDosyasi = g;
    return;
  }
  if (typeof window === 'undefined') {
    ortamDosyasi = null;
    return;
  }
  try {
    const r = await fetch('/bulut-ortam.json', { cache: 'no-store' });
    if (!r.ok) {
      ortamDosyasi = null;
      return;
    }
    const j = (await r.json()) as { url?: string; anonKey?: string };
    ortamDosyasi = bulutAyarDogrula(String(j.url ?? ''), String(j.anonKey ?? ''));
  } catch {
    ortamDosyasi = null;
  }
}

export function bulutAyar(): BulutAyar | null {
  const g = gomuluAyar();
  if (g) return g;
  return ortamDosyasi ?? null;
}

export function bulutAcik(): boolean {
  return bulutAyar() !== null;
}
