import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMod,
  type UrunMod,
  type UrunModId,
  URUN_MODLARI,
  type ModSeviye,
  aktifModaCoz,
} from './ModlarSabit';

export type { UrunModId, UrunMod, ModSeviye };
export { URUN_MODLARI, getMod };

const KEY = 'sy_aktif_urun_modu';

export async function getAktifModId(): Promise<UrunModId> {
  // Eski mod2 → mod1; "Yakında" modlar seçilemez → mod1 (kayıtlı değer korunur)
  return aktifModaCoz(await AsyncStorage.getItem(KEY));
}

export async function setAktifModId(id: UrunModId): Promise<void> {
  // Hazır olmayan mod kaydedilmez
  if (!getMod(id).hazir || getMod(id).id !== id) return;
  await AsyncStorage.setItem(KEY, id);
}
