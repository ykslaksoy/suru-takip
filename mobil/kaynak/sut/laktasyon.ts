import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_mod4_laktasyon';

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
    const list = JSON.parse(raw) as LaktasyonKaydi[];
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.baslangic).getTime() - new Date(a.baslangic).getTime())
      : [];
  } catch {
    return [];
  }
}

export async function addLaktasyonKaydi(
  input: Omit<LaktasyonKaydi, 'id' | 'createdAt'>
): Promise<LaktasyonKaydi> {
  const kayit: LaktasyonKaydi = { ...input, id: uuidv4(), createdAt: new Date().toISOString() };
  const list = await getLaktasyonKayitlari();
  const filtered = list.filter((k) => k.hayvanId !== kayit.hayvanId);
  filtered.unshift(kayit);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
  return kayit;
}

export async function clearLaktasyonKayitlari(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
