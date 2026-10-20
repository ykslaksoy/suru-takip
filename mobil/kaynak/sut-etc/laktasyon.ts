import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_mod7_laktasyon';

export type LaktasyonKaydi = {
  id: string;
  hayvanId: string;
  baslangic: string;
  notes: string;
  createdAt: string;
};

export async function getLaktasyonKayitlari(): Promise<LaktasyonKaydi[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LaktasyonKaydi[];
  } catch {
    return [];
  }
}

export async function addLaktasyonKaydi(
  input: Omit<LaktasyonKaydi, 'id' | 'createdAt'>,
): Promise<LaktasyonKaydi> {
  const kayit: LaktasyonKaydi = { ...input, id: uuidv4(), createdAt: new Date().toISOString() };
  const list = await getLaktasyonKayitlari();
  list.unshift(kayit);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return kayit;
}
