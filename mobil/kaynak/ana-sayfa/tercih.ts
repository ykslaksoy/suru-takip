import AsyncStorage from '@react-native-async-storage/async-storage';
import { MENU_KATALOGU_HARITASI, type MenuOgesi } from './katalog';
import { VARSAYILAN_ANA_SAYFA } from './varsayilan';

const KEY = 'sy_ana_sayfa_tercih';
const MAX_HIZLI_ISLEM = 9;

export type AnaSayfaTercih = {
  hizliIslemIds: string[];
  kestirmeIds: string[];
};

function gecerliIdler(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === 'string' && id in MENU_KATALOGU_HARITASI);
}

/** Çakışmayı önle: grid’de olan kestirmeden, kestirmede olan grid’den çıkar */
export function normalizeAnaSayfaTercih(tercih: AnaSayfaTercih): AnaSayfaTercih {
  const hizliIslemIds = [...new Set(gecerliIdler(tercih.hizliIslemIds))].slice(0, MAX_HIZLI_ISLEM);
  const hizliSet = new Set(hizliIslemIds);
  const kestirmeIds = [...new Set(gecerliIdler(tercih.kestirmeIds))].filter((id) => !hizliSet.has(id));
  return { hizliIslemIds, kestirmeIds };
}

export function menuOgesiCoz(ids: string[]): MenuOgesi[] {
  return ids.map((id) => MENU_KATALOGU_HARITASI[id]).filter(Boolean);
}

export async function getAnaSayfaTercih(): Promise<AnaSayfaTercih> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...VARSAYILAN_ANA_SAYFA };
  try {
    return normalizeAnaSayfaTercih(JSON.parse(raw) as AnaSayfaTercih);
  } catch {
    return { ...VARSAYILAN_ANA_SAYFA };
  }
}

export async function saveAnaSayfaTercih(tercih: AnaSayfaTercih): Promise<AnaSayfaTercih> {
  const normalized = normalizeAnaSayfaTercih(tercih);
  await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
  return normalized;
}

export async function resetAnaSayfaTercih(): Promise<AnaSayfaTercih> {
  await AsyncStorage.removeItem(KEY);
  return { ...VARSAYILAN_ANA_SAYFA };
}
