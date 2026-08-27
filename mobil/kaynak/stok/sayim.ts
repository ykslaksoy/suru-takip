import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { YemSayim } from '@/kaynak/cekirdek/tipler';

const KEY = 'sy_yem_sayim';

async function readAll(): Promise<YemSayim[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(list: YemSayim[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

/** Stok güncellemesinde yem sayımı kaydet. */
export async function kaydetYemSayim(
  stockId: string,
  quantityKg: number,
  note = 'sayım',
  recordedAt?: string
): Promise<YemSayim> {
  const row: YemSayim = {
    id: uuidv4(),
    stockId,
    quantityKg,
    recordedAt: recordedAt ?? new Date().toISOString(),
    note,
  };
  const list = await readAll();
  list.push(row);
  await writeAll(list);
  return row;
}

export async function getYemSayimlari(stockId?: string): Promise<YemSayim[]> {
  const list = await readAll();
  const filtered = stockId ? list.filter((s) => s.stockId === stockId) : list;
  return filtered.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

/** Belirli tarihten önceki en son sayım. */
export async function sonSayimOncesi(stockId: string, beforeIso: string): Promise<YemSayim | null> {
  const t = new Date(beforeIso).getTime();
  const list = await getYemSayimlari(stockId);
  return list.find((s) => new Date(s.recordedAt).getTime() <= t) ?? null;
}

export async function clearAllYemSayim(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
