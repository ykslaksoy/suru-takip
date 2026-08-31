import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMod,
  type UrunMod,
  type UrunModId,
  URUN_MODLARI,
  type ModSeviye,
} from './ModlarSabit';

export type { UrunModId, UrunMod, ModSeviye };
export { URUN_MODLARI, getMod };

const KEY = 'sy_aktif_urun_modu';

export async function getAktifModId(): Promise<UrunModId> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === 'mod1' || raw === 'mod2' || raw === 'mod3' || raw === 'mod4') return raw;
  return 'mod1';
}

export async function setAktifModId(id: UrunModId): Promise<void> {
  await AsyncStorage.setItem(KEY, id);
}
