import { getAnimals, getHealthRecords, getStockItems } from '@/kaynak/cekirdek/veritabani';
import {
  ASI_PROGRAMI,
  asiStokUyarilari,
  hesaplaAsiStokDurumu,
  type AsiStokDurum,
} from '@/kaynak/cekirdek/asi-programi';

export { ASI_PROGRAMI, hesaplaAsiStokDurumu, asiStokUyarilari };
export type { AsiStokDurum };

/** Canlı veriden aşı + stok durumu */
export async function getAsiTakvimiDurumu(): Promise<AsiStokDurum[]> {
  const [animals, health, stock] = await Promise.all([
    getAnimals(),
    getHealthRecords(),
    getStockItems(),
  ]);
  return hesaplaAsiStokDurumu(animals, health, stock);
}
