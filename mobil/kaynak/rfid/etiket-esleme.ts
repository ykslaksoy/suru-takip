/**
 * RFID etiket ↔ hayvan eşleme.
 */

import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { rfidEtiketEsle } from './ble-okuyucu';

export type RfidEslemeSonuc = {
  hayvan: Animal | null;
  earTagOneri: string;
  gehisIdOneri: string;
  eslesme: 'gehis' | 'kupe' | 'yok';
};

export async function rfidHayvanBul(ham: string): Promise<RfidEslemeSonuc> {
  const { earTag, gehisId } = rfidEtiketEsle(ham);
  const animals = await getAnimals();
  const byGehis = animals.find(
    (a) => a.gehisId && a.gehisId.replace(/\s/g, '').toUpperCase() === gehisId
  );
  if (byGehis) {
    return { hayvan: byGehis, earTagOneri: earTag, gehisIdOneri: gehisId, eslesme: 'gehis' };
  }
  const byKupe = animals.find(
    (a) => a.earTag.replace(/\s/g, '').toUpperCase() === earTag.replace(/\s/g, '').toUpperCase()
  );
  if (byKupe) {
    return { hayvan: byKupe, earTagOneri: earTag, gehisIdOneri: gehisId, eslesme: 'kupe' };
  }
  return { hayvan: null, earTagOneri: earTag, gehisIdOneri: gehisId, eslesme: 'yok' };
}
