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

let ortamDosyasi: BulutAyar | null | undefined;
let yuklemePromise: Promise<boolean> | null = null;

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

async function ortamDosyasindanOku(onbellekKir: number): Promise<BulutAyar | null> {
  if (typeof window === 'undefined') return null;
  try {
    const r = await fetch(`/bulut-ortam.json?v=${onbellekKir}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as { url?: string; anonKey?: string };
    return bulutAyarDogrula(String(j.url ?? ''), String(j.anonKey ?? ''));
  } catch {
    return null;
  }
}

/**
 * Web: `/bulut-ortam.json` yüklemesi. Tek promise — yarışları önler.
 * @returns true ise bulut yapılandırması kullanılabilir
 */
export async function bulutOrtamYukle(zorla = false): Promise<boolean> {
  if (zorla) {
    ortamDosyasi = undefined;
    yuklemePromise = null;
  }
  if (yuklemePromise) return yuklemePromise;

  yuklemePromise = (async () => {
    const g = gomuluAyar();
    if (g) {
      ortamDosyasi = g;
      return true;
    }
    ortamDosyasi = await ortamDosyasindanOku(Date.now());
    return ortamDosyasi !== null;
  })();

  return yuklemePromise;
}

/** Bulut API kullanmadan önce bekleyin (race önleme). */
export async function bulutOrtamBekle(): Promise<boolean> {
  return bulutOrtamYukle();
}

export function bulutAyar(): BulutAyar | null {
  const g = gomuluAyar();
  if (g) return g;
  if (ortamDosyasi === undefined) return null;
  return ortamDosyasi;
}

export function bulutAcik(): boolean {
  return bulutAyar() !== null;
}
