import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_mod4_sagimlar';

export type SagimKaydi = {
  id: string;
  litre: number;
  hayvanSayisi: number;
  tarih: string;
  notes: string;
  createdAt: string;
};

export async function getSagimKayitlari(): Promise<SagimKaydi[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as SagimKaydi[];
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      : [];
  } catch {
    return [];
  }
}

export async function addSagimKaydi(
  input: Omit<SagimKaydi, 'id' | 'createdAt'>
): Promise<SagimKaydi> {
  const kayit: SagimKaydi = { ...input, id: uuidv4(), createdAt: new Date().toISOString() };
  const list = await getSagimKayitlari();
  list.unshift(kayit);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return kayit;
}

export async function clearSagimKayitlari(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
