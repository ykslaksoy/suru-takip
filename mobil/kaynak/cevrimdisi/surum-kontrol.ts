/** Sunucu web sürümü ile yerel kayıtlı sürümü karşılaştırır (IndexedDB / localStorage silinmez). */
const ANAHTAR = 'sy_web_surum_v1';

export async function sunucuWebSurumu(): Promise<string | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const r = await fetch(`/surum.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as { surum?: string };
    return String(j.surum ?? '').trim() || null;
  } catch {
    return null;
  }
}

export function yerelWebSurumu(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const v = localStorage.getItem(ANAHTAR);
  return v ? String(v) : null;
}

export function yerelWebSurumuKaydet(surum: string): void {
  try {
    localStorage.setItem(ANAHTAR, surum);
  } catch {
    /* quota */
  }
}

/** true = sunucuda daha yeni build var; veri silinmeden yenileme gerekir */
export async function webSurumGuncelMi(): Promise<boolean> {
  const sunucu = await sunucuWebSurumu();
  if (!sunucu) return true;
  const yerel = yerelWebSurumu();
  if (!yerel) {
    yerelWebSurumuKaydet(sunucu);
    return true;
  }
  return yerel === sunucu;
}
