import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_mod2_katimlar';

export type KatimKaydi = {
  id: string;
  kocEarTag: string;
  padok: string;
  tarih: string;
  disiSayisi: number;
  notes: string;
  createdAt: string;
};

export async function getKatimKayitlari(): Promise<KatimKaydi[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as KatimKaydi[];
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      : [];
  } catch {
    return [];
  }
}

export async function addKatimKaydi(
  input: Omit<KatimKaydi, 'id' | 'createdAt'>
): Promise<KatimKaydi> {
  const kayit: KatimKaydi = {
    ...input,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  const list = await getKatimKayitlari();
  list.unshift(kayit);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return kayit;
}

export async function clearKatimKayitlari(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
