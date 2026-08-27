import type { Animal } from '@/kaynak/cekirdek/tipler';

/** Besi yaşına gelen kuzular (≈2–3,5 ay bandı) */
export function besiyeHazirKuzular(animals: Animal[], minAy = 2, maxAy = 4): Animal[] {
  const now = Date.now();
  return animals.filter((a) => {
    if (a.status === 'sold' || a.status === 'dead') return false;
    const ay = (now - new Date(a.birthDate).getTime()) / (30.44 * 86400000);
    return ay >= minAy && ay <= maxAy;
  });
}
