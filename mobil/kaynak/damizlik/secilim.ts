import type { Animal } from '@/kaynak/cekirdek/tipler';
import { calculateADG, getAnimals, getAllHealthRecordsForAsi, getLatestWeight, upsertAnimal } from '@/kaynak/cekirdek/veritabani';

const ADAY_ETIKET = 'damızlık aday';

export type DamizlikSkor = {
  animal: Animal;
  skor: number;
  adg: number | null;
  kilo: number | null;
  asi: number;
  turkvet: boolean;
  aday: boolean;
  nedenler: string[];
};

function adayMi(a: Animal): boolean {
  return /damızlık|damizlik|aday/i.test(a.notes);
}

/** Büyüme + kimlik + sağlık ile seleksiyon sıralaması */
export async function secilimSirala(): Promise<DamizlikSkor[]> {
  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  const health = await getAllHealthRecordsForAsi();
  const out: DamizlikSkor[] = [];

  for (const animal of animals) {
    const [adg, kilo] = await Promise.all([calculateADG(animal.id), getLatestWeight(animal.id)]);
    const asi = health.filter((h) => h.animalId === animal.id && h.recordType === 'vaccine').length;
    const turkvet = animal.turkvetNo.trim().length >= 8;
    const aday = adayMi(animal);
    let skor = 0;
    const nedenler: string[] = [];
    if (adg != null && adg > 0) {
      skor += Math.min(40, Math.round(adg * 100));
      nedenler.push(`ADG ${adg.toFixed(3)} kg/gün`);
    }
    if (kilo != null) {
      skor += Math.min(20, Math.round(kilo / 5));
      nedenler.push(`${kilo} kg`);
    }
    if (asi > 0) {
      skor += Math.min(20, asi * 5);
      nedenler.push(`${asi} aşı`);
    }
    if (turkvet) {
      skor += 15;
      nedenler.push('TÜRKVET');
    }
    if (aday) {
      skor += 10;
      nedenler.push('Aday işaretli');
    }
    out.push({ animal, skor, adg, kilo, asi, turkvet, aday, nedenler });
  }

  return out.sort((a, b) => b.skor - a.skor);
}

export async function damizlikAdayIsaretle(hayvanId: string, aday = true): Promise<Animal | null> {
  const list = await getAnimals();
  const a = list.find((x) => x.id === hayvanId);
  if (!a) return null;
  let notes = a.notes;
  if (aday) {
    if (!adayMi(a)) notes = `${notes ? `${notes} · ` : ''}${ADAY_ETIKET}`;
  } else {
    notes = notes
      .replace(/\s*·?\s*damızlık aday/gi, '')
      .replace(/\s*·?\s*damizlik aday/gi, '')
      .replace(/\s*·?\s*aday/gi, '')
      .trim();
  }
  return upsertAnimal({ ...a, notes });
}

export async function listeleAdaylar(): Promise<Animal[]> {
  return (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead' && adayMi(a));
}
