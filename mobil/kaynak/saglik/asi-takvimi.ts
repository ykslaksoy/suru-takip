import { getAnimals, getHealthRecords, getStockItems } from '@/kaynak/cekirdek/veritabani';
import {
  ASI_PROGRAMI,
  asiStokUyarilari,
  hesaplaAsiStokDurumu,
  type AsiStokDurum,
} from '@/kaynak/cekirdek/asi-programi';

export { ASI_PROGRAMI, hesaplaAsiStokDurumu, asiStokUyarilari };
export type { AsiStokDurum };

/** Canlı veriden aşı + stok durumu (tüm sağlık kayıtları — limit yok) */
export async function getAsiTakvimiDurumu(): Promise<AsiStokDurum[]> {
  const [animals, health, stock] = await Promise.all([
    getAnimals(),
    getHealthRecords(undefined, { limit: null }),
    getStockItems(),
  ]);
  return hesaplaAsiStokDurumu(animals, health, stock);
}
