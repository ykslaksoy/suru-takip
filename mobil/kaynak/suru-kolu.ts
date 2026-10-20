/**
 * Süt / et sürüsü kolu — hayvan ve padok etiketi (Mod 7).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export type SuruKolu = 'sut' | 'et';

const HAYVAN_KEY = 'sy_suru_kolu_hayvan';
const PADOK_KEY = 'sy_suru_kolu_padok';

type Store = Record<string, SuruKolu>;

async function read(key: string): Promise<Store> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

async function write(key: string, data: Store): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getPadokKoluMap(): Promise<Store> {
  return read(PADOK_KEY);
}

export async function getHayvanKoluMap(): Promise<Store> {
  return read(HAYVAN_KEY);
}

export async function setPadokKolu(padok: string, kol: SuruKolu | null): Promise<void> {
  const p = padok.trim();
  if (!p) return;
  const m = await read(PADOK_KEY);
  if (kol) m[p] = kol;
  else delete m[p];
  await write(PADOK_KEY, m);
}

export async function setHayvanKoluBulk(ids: string[], kol: SuruKolu): Promise<void> {
  const m = await read(HAYVAN_KEY);
  for (const id of ids) m[id] = kol;
  await write(HAYVAN_KEY, m);
}

/** Padok etiketi → hayvan etiketi → not/padok metni */
export async function hayvanSuruKolu(a: Animal, padokMap?: Store, hayvanMap?: Store): Promise<SuruKolu | null> {
  const pm = padokMap ?? await getPadokKoluMap();
  const hm = hayvanMap ?? await getHayvanKoluMap();
  if (hm[a.id]) return hm[a.id];
  if (a.paddock && pm[a.paddock]) return pm[a.paddock];
  const blob = `${a.notes} ${a.paddock}`.toLocaleLowerCase('tr-TR');
  if (/etçi|et sürü|et suru|et kolu|\bet\b.*sürü/i.test(blob)) return 'et';
  if (/süt sürü|sut suru|sağmal|sagmal|süt kolu|sut kolu/i.test(blob)) return 'sut';
  return null;
}

export function hayvanSuruKoluSync(
  a: Animal,
  padokMap: Store,
  hayvanMap: Store,
): SuruKolu | null {
  if (hayvanMap[a.id]) return hayvanMap[a.id];
  if (a.paddock && padokMap[a.paddock]) return padokMap[a.paddock];
  const blob = `${a.notes} ${a.paddock}`.toLocaleLowerCase('tr-TR');
  if (/etçi|et sürü|et suru|et kolu/i.test(blob)) return 'et';
  if (/süt sürü|sut suru|sağmal|sagmal|süt kolu|sut kolu/i.test(blob)) return 'sut';
  return null;
}
