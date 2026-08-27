import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimal, getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';

/** Anne–kuzu bağlama yardımcısı */
export function anneKuzuOnerileri(
  kuzular: Animal[],
  disiler: Animal[]
): { kuzuId: string; adayAnneler: Animal[] }[] {
  return kuzular
    .filter((k) => !k.motherId)
    .map((k) => ({
      kuzuId: k.id,
      adayAnneler: disiler.filter(
        (d) => d.paddock === k.paddock || d.status === 'lactating' || d.status === 'pregnant'
      ),
    }));
}

export async function baglaAnneKuzu(kuzuId: string, anneId: string): Promise<Animal | null> {
  const [kuzu, anne] = await Promise.all([getAnimal(kuzuId), getAnimal(anneId)]);
  if (!kuzu || !anne) return null;
  const guncel = await upsertAnimal({
    ...kuzu,
    motherId: anne.id,
    paddock: kuzu.paddock || anne.paddock,
    notes: kuzu.notes.includes('anne bağlı')
      ? kuzu.notes
      : `${kuzu.notes ? `${kuzu.notes} · ` : ''}anne bağlı`.trim(),
  });
  if (anne.status !== 'lactating' && anne.status !== 'sold' && anne.status !== 'dead') {
    await upsertAnimal({ ...anne, status: 'lactating' });
  }
  return guncel;
}

export async function kuzulatmaDurumuOku(): Promise<{
  baglanmamis: Animal[];
  disiler: Animal[];
  oneriler: { kuzu: Animal; adayAnneler: Animal[] }[];
}> {
  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  const now = Date.now();
  const kuzular = animals.filter((a) => {
    const ay = (now - new Date(a.birthDate).getTime()) / (30.44 * 86400000);
    return ay <= 6;
  });
  const disiler = animals.filter((a) => a.sex === 'female');
  const baglanmamis = kuzular.filter((k) => !k.motherId);
  const raw = anneKuzuOnerileri(baglanmamis, disiler);
  const oneriler = raw.map((o) => ({
    kuzu: baglanmamis.find((k) => k.id === o.kuzuId)!,
    adayAnneler: o.adayAnneler,
  }));
  return { baglanmamis, disiler, oneriler };
}
