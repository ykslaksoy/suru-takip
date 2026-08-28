import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { countAnimalsInPaddock } from '@/kaynak/cekirdek/veritabani';

const KEY = 'sy_padoklar_v1';

export type Padok = {
  id: string;
  ad: string;
  kapasite: number;
  karantina: boolean;
  not: string;
};

const VARSAYILAN: Omit<Padok, 'id'>[] = [
  { ad: 'Padok A', kapasite: 50, karantina: false, not: '' },
  { ad: 'Padok B', kapasite: 50, karantina: false, not: '' },
  { ad: 'Karantina', kapasite: 20, karantina: true, not: 'Yeni gelenler · yonca + su' },
];

async function oku(): Promise<Padok[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as Padok[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: Padok[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function ensureVarsayilanPadoklar(): Promise<Padok[]> {
  let list = await oku();
  if (list.length === 0) {
    list = VARSAYILAN.map((p) => ({ ...p, id: uuidv4() }));
    await yaz(list);
  }
  return list;
}

export async function getPadoklar(): Promise<Padok[]> {
  const list = await ensureVarsayilanPadoklar();
  return list.sort((a, b) => {
    if (a.karantina !== b.karantina) return a.karantina ? -1 : 1;
    return a.ad.localeCompare(b.ad, 'tr');
  });
}

export async function getPadokByAd(ad: string): Promise<Padok | null> {
  const p = ad.trim();
  if (!p) return null;
  return (await getPadoklar()).find((x) => x.ad === p) ?? null;
}

export async function addPadok(input: {
  ad: string;
  kapasite: number;
  karantina?: boolean;
  not?: string;
}): Promise<Padok> {
  const ad = input.ad.trim();
  if (!ad) throw new Error('Padok adı gerekli');
  const list = await getPadoklar();
  if (list.some((p) => p.ad.toLowerCase() === ad.toLowerCase())) {
    throw new Error('Bu padok zaten var');
  }
  const kayit: Padok = {
    id: uuidv4(),
    ad,
    kapasite: Math.max(1, input.kapasite || 1),
    karantina: input.karantina ?? false,
    not: input.not?.trim() ?? '',
  };
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function updatePadok(
  id: string,
  patch: Partial<Pick<Padok, 'ad' | 'kapasite' | 'karantina' | 'not'>>
): Promise<Padok | null> {
  const list = await getPadoklar();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch };
  if (patch.ad != null) next.ad = patch.ad.trim();
  if (patch.kapasite != null) next.kapasite = Math.max(1, patch.kapasite);
  list[idx] = next;
  await yaz(list);
  return next;
}

export async function silPadok(id: string): Promise<boolean> {
  const list = await getPadoklar();
  const padok = list.find((p) => p.id === id);
  if (!padok) return false;
  const dolu = await countAnimalsInPaddock(padok.ad);
  if (dolu > 0) throw new Error(`${padok.ad} içinde ${dolu} hayvan var`);
  await yaz(list.filter((p) => p.id !== id));
  return true;
}

export async function padokDoluluk(padok: Padok): Promise<{ hayvan: number; bos: number; dolu: boolean }> {
  const hayvan = await countAnimalsInPaddock(padok.ad);
  const bos = Math.max(0, padok.kapasite - hayvan);
  return { hayvan, bos, dolu: hayvan >= padok.kapasite };
}
