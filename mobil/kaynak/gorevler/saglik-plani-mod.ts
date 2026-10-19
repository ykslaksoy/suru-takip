/**
 * Mod bazlı önerilen plan erişimi (aktif mod + hazırlık).
 */
import { getAktifModId } from '@/sabitler/Modlar';
import { getMod, type UrunModId } from '@/sabitler/ModlarSabit';
import type { SaglikPlani } from './saglik-plani';
import { ONERILEN_PLANLAR, VETERINER_ONERI_NOTU, onerilenPlanModEtiketi } from './saglik-plani-paketleri';

export { VETERINER_ONERI_NOTU, ONERILEN_PLANLAR, onerilenPlanModEtiketi } from './saglik-plani-paketleri';

/** Mod 1 hızlı besi ayrı; diğer hazır modlarda önerilen plan açık. */
export function onerilenPlanAcikMiSync(modId: UrunModId): boolean {
  if (modId === 'mod1') return false;
  const mod = getMod(modId);
  return mod.hazir && mod.seviye === 'tam';
}

export async function onerilenPlanAcikMi(): Promise<boolean> {
  return onerilenPlanAcikMiSync(await getAktifModId());
}

export async function getOnerilenPlanByMod(modId: UrunModId): Promise<SaglikPlani | null> {
  const mod = getMod(modId);
  if (modId === 'mod1' || !mod.hazir || mod.seviye !== 'tam') return null;
  const p = ONERILEN_PLANLAR[modId];
  return {
    asi: [...p.asi],
    parazit: [...p.parazit],
    vitamin: [...p.vitamin],
  };
}
