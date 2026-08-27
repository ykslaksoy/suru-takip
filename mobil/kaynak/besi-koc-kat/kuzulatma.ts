import type { Animal } from '@/kaynak/cekirdek/tipler';

/** Anne–kuzu bağlama yardımcısı (iskelet) */
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
