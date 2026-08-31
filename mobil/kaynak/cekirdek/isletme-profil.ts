import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sy_isletme_profil';

export type IsletmeProfil = {
  isletmeAdi: string;
  yetkiliAdi?: string;
  telefon?: string;
  kvkkOnay: boolean;
  kvkkOnayTarihi?: string;
  olusturuldu: string;
};

const VARSAYILAN: IsletmeProfil = {
  isletmeAdi: '',
  kvkkOnay: false,
  olusturuldu: new Date().toISOString(),
};

export async function getIsletmeProfil(): Promise<IsletmeProfil> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...VARSAYILAN };
  try {
    return { ...VARSAYILAN, ...JSON.parse(raw) };
  } catch {
    return { ...VARSAYILAN };
  }
}

export async function kaydetIsletmeProfil(
  profil: Partial<IsletmeProfil>,
): Promise<IsletmeProfil> {
  const mevcut = await getIsletmeProfil();
  const birlesik: IsletmeProfil = {
    ...mevcut,
    ...profil,
    olusturuldu: mevcut.olusturuldu || new Date().toISOString(),
  };
  if (profil.kvkkOnay && !mevcut.kvkkOnay) {
    birlesik.kvkkOnayTarihi = new Date().toISOString();
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(birlesik));
  return birlesik;
}

export async function isletmeProfilTamam(): Promise<boolean> {
  const p = await getIsletmeProfil();
  return p.isletmeAdi.trim().length >= 2 && p.kvkkOnay;
}
