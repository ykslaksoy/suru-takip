import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_planlanan_gorevler';

export type PlanlananGorev = {
  id: string;
  baslik: string;
  aciklama: string;
  /** YYYY-MM-DD — planlanan gün */
  tarih: string;
  href: string;
  tamam: boolean;
  createdAt: string;
};

async function oku(): Promise<PlanlananGorev[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as PlanlananGorev[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: PlanlananGorev[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getPlanlananGorevler(): Promise<PlanlananGorev[]> {
  return (await oku()).sort((a, b) => a.tarih.localeCompare(b.tarih) || b.createdAt.localeCompare(a.createdAt));
}

export async function addPlanlananGorev(
  input: Omit<PlanlananGorev, 'id' | 'createdAt' | 'tamam'> & { tamam?: boolean }
): Promise<PlanlananGorev> {
  const kayit: PlanlananGorev = {
    ...input,
    id: uuidv4(),
    tamam: input.tamam ?? false,
    href: input.href || '/(tabs)',
    createdAt: new Date().toISOString(),
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function setPlanlananTamam(id: string, tamam: boolean): Promise<void> {
  const list = await oku();
  const idx = list.findIndex((g) => g.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], tamam };
  await yaz(list);
}

export async function silPlanlananGorev(id: string): Promise<void> {
  await yaz((await oku()).filter((g) => g.id !== id));
}
