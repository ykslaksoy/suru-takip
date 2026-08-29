/**
 * Aciliyet skoru — analiz sonucu için tek yer.
 */

import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import type { HastalikTeshis } from './teshis';

export type AciliyetSeviye = VetSuggestion['urgency'];

const RANK: Record<AciliyetSeviye, number> = { low: 0, medium: 1, high: 2 };

export function birlestirAciliyet(a: AciliyetSeviye, b: AciliyetSeviye): AciliyetSeviye {
  return RANK[a] >= RANK[b] ? a : b;
}

export function aciliyetEtiket(u: AciliyetSeviye): string {
  if (u === 'high') return 'Yüksek — vet önerilir';
  if (u === 'medium') return 'Orta — izle / hazırlan';
  return 'Düşük — gözlem';
}

export function aciliyetRenkAnahtar(u: AciliyetSeviye): 'danger' | 'warning' | 'success' {
  if (u === 'high') return 'danger';
  if (u === 'medium') return 'warning';
  return 'success';
}

/** Teşhis + öneriden birleşik aciliyet */
export function teshisAciliyet(teshis: HastalikTeshis, oneri?: VetSuggestion | null): AciliyetSeviye {
  let u: AciliyetSeviye = oneri?.urgency ?? 'low';
  if (teshis.derece === 'ileri') u = birlestirAciliyet(u, 'high');
  if (teshis.vetDanisma === 'zorunlu') u = birlestirAciliyet(u, 'high');
  if (teshis.bulasici) u = birlestirAciliyet(u, 'medium');
  return u;
}
