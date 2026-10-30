/**
 * Yönetici paneli uzak özellik bayrakları — `/api/ozellik-bayraklar` (admin_ozellik_bayrak tablosu).
 *
 * Kural: uzak bayrak yalnız KAPATABİLİR. Yerel ürün kararı (ör. Mod 1'de önerilen plan kapalı)
 * uzak bayrakla açılamaz; böylece panel hatası canlıda istenmeyen içerik açmaz.
 * Ağ yok / API yapılandırılmamış / bayrak tanımsız → yerel karar geçerli.
 */
export type UzakBayrakHaritasi = Record<string, { acik: boolean; aciklama?: string }>;

export const BAYRAK_ONERILEN_SAGLIK_PLANI = 'onerilen_saglik_plani';
const ONBELLEK_MS = 5 * 60_000;

let onbellek: { zaman: number; harita: UzakBayrakHaritasi } | null = null;

export function uzakBayrakApiAdresi(): string | null {
  const taban = String(process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
  if (taban) return `${taban}/api/ozellik-bayraklar`;
  const g = globalThis as { location?: { origin?: string } };
  return g.location?.origin ? `${g.location.origin}/api/ozellik-bayraklar` : null;
}

export function bayrakHaritasiCoz(veri: unknown): UzakBayrakHaritasi {
  const out: UzakBayrakHaritasi = {};
  const b = (veri as { bayraklar?: unknown })?.bayraklar;
  if (!b || typeof b !== 'object') return out;
  for (const [id, v] of Object.entries(b as Record<string, unknown>)) {
    const acik = (v as { acik?: unknown })?.acik;
    if (typeof acik === 'boolean') out[id] = { acik, aciklama: (v as { aciklama?: string }).aciklama };
  }
  return out;
}

/** Yerel karar ∧ uzak bayrak (tanımsızsa yerel karar). */
export function bayrakBirlestir(yerel: boolean, harita: UzakBayrakHaritasi, id: string): boolean {
  const u = harita[id];
  return u ? yerel && u.acik : yerel;
}

export async function uzakBayraklariGetir(
  fetchFn: typeof fetch | undefined = (globalThis as { fetch?: typeof fetch }).fetch,
  simdi = Date.now(),
): Promise<UzakBayrakHaritasi> {
  if (onbellek && simdi - onbellek.zaman < ONBELLEK_MS) return onbellek.harita;
  const url = uzakBayrakApiAdresi();
  if (!url || !fetchFn) return {};
  try {
    const r = await fetchFn(url);
    if (!r.ok) return onbellek?.harita ?? {};
    const harita = bayrakHaritasiCoz(await r.json());
    onbellek = { zaman: simdi, harita };
    return harita;
  } catch {
    return onbellek?.harita ?? {};
  }
}

export function uzakBayrakOnbellekSifirla(): void {
  onbellek = null;
}
