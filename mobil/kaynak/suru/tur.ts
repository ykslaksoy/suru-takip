import type { AnimalSpecies } from '@/kaynak/cekirdek/tipler';

export type { AnimalSpecies };

export const TUR_SECENEKLERI: { id: AnimalSpecies; label: string; emoji: string }[] = [
  { id: 'sheep', label: 'Koyun', emoji: '🐑' },
  { id: 'goat', label: 'Keçi', emoji: '🐐' },
];

export function turEtiketi(species: AnimalSpecies): string {
  return TUR_SECENEKLERI.find((t) => t.id === species)?.label ?? 'Koyun';
}

export function turEmoji(species: AnimalSpecies): string {
  return TUR_SECENEKLERI.find((t) => t.id === species)?.emoji ?? '🐑';
}

export function turkvetSpeciesCode(species: AnimalSpecies): 'ovine' | 'caprine' {
  return species === 'goat' ? 'caprine' : 'ovine';
}

export function normalizeSpecies(raw?: string | null): AnimalSpecies {
  if (raw === 'goat' || raw === 'caprine') return 'goat';
  return 'sheep';
}
