/** Stok kalemi birim fiyatı (son alış) — maliyet hesabında kullanılır */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';

const KEY = 'sy_stok_birim_fiyat_v1';

export async function getBirimFiyatlar(): Promise<Record<string, number>> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export async function setBirimFiyat(stockId: string, fiyat: number): Promise<void> {
  const f = await getBirimFiyatlar();
  f[stockId] = fiyat;
  await kaliciSetItem(KEY, JSON.stringify(f));
}
