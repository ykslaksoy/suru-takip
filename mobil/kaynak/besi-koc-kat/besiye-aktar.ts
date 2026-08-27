import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimal, getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';

/** Besi yaşına gelen kuzular (≈2–4 ay bandı) */
export function besiyeHazirKuzular(animals: Animal[], minAy = 2, maxAy = 4): Animal[] {
  const now = Date.now();
  return animals.filter((a) => {
    if (a.status === 'sold' || a.status === 'dead') return false;
    const ay = (now - new Date(a.birthDate).getTime()) / (30.44 * 86400000);
    return ay >= minAy && ay <= maxAy;
  });
}

export async function besiyeHazirListele(): Promise<Animal[]> {
  const animals = await getAnimals();
  return besiyeHazirKuzular(animals).filter((a) => !/besi/i.test(`${a.notes} ${a.paddock}`));
}

/** Kuzuyu besi grubuna alır: padok + not */
export async function besiyeAl(
  hayvanId: string,
  padok = 'Besi'
): Promise<Animal | null> {
  const a = await getAnimal(hayvanId);
  if (!a) return null;
  const notes = /besi/i.test(a.notes) ? a.notes : `${a.notes ? `${a.notes} · ` : ''}besi`.trim();
  return upsertAnimal({
    ...a,
    paddock: padok.trim() || a.paddock || 'Besi',
    notes,
    status: a.status === 'healthy' || a.status === 'lactating' ? 'healthy' : a.status,
  });
}

export async function besiyeAlToplu(hayvanIds: string[], padok = 'Besi'): Promise<number> {
  let n = 0;
  for (const id of hayvanIds) {
    const r = await besiyeAl(id, padok);
    if (r) n += 1;
  }
  return n;
}
