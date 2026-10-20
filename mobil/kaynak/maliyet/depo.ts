import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { MaliyetAyar } from './hesap';

const KEY = 'sy_maliyet_ayar_v1';

export async function getMaliyetAyar(): Promise<MaliyetAyar> {
  const raw = await kaliciGetItem(KEY);
  if (raw) {
    try {
      const o = JSON.parse(raw) as Partial<MaliyetAyar>;
      return { partiler: o.partiler ?? {}, hayvanAlis: o.hayvanAlis ?? {} };
    } catch {
      /* bozuk */
    }
  }
  return { partiler: {}, hayvanAlis: {} };
}

export async function saveMaliyetAyar(a: MaliyetAyar): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(a));
}
