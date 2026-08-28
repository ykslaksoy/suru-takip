import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sy_seri_oturum_v1';

export type SeriMod = 'asi' | 'tartim';

export type SeriKayit = {
  id: string;
  metin: string;
  zaman: string;
};

export type SeriOturum = {
  mod: SeriMod;
  baslangic: string;
  kayitlar: SeriKayit[];
};

export async function getSeriOturum(): Promise<SeriOturum | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SeriOturum;
  } catch {
    return null;
  }
}

export async function seriOturumBaslat(mod: SeriMod): Promise<SeriOturum> {
  const oturum: SeriOturum = { mod, baslangic: new Date().toISOString(), kayitlar: [] };
  await AsyncStorage.setItem(KEY, JSON.stringify(oturum));
  return oturum;
}

export async function seriKayitEkle(metin: string): Promise<SeriOturum | null> {
  const oturum = await getSeriOturum();
  if (!oturum) return null;
  oturum.kayitlar.unshift({
    id: `${Date.now()}`,
    metin: metin.trim(),
    zaman: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(oturum));
  return oturum;
}

export async function seriOturumBitir(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export const SERI_MOD_ETIKET: Record<SeriMod, string> = {
  asi: 'Seri aşılama',
  tartim: 'Seri tartım',
};
