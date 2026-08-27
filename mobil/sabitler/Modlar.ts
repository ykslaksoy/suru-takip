import AsyncStorage from '@react-native-async-storage/async-storage';

export type UrunModId = 'mod1' | 'mod2' | 'mod3' | 'mod4';

export type UrunMod = {
  id: UrunModId;
  no: number;
  baslik: string;
  kisa: string;
  aciklama: string;
  icon: string;
  /** Şu an tıklanabilir mi */
  hazir: boolean;
  href: string | null;
};

/** Ana ürün hatları — Ayarlar’da seçilir */
export const URUN_MODLARI: UrunMod[] = [
  {
    id: 'mod1',
    no: 1,
    baslik: 'Kuzu alarak besi',
    kisa: 'Satın al → besi',
    aciklama: '2–3 aylık kuzu al, karantina, aşı, tartım, rasyon.',
    icon: '🛒',
    hazir: true,
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod2',
    no: 2,
    baslik: 'Koç katarak besi',
    kisa: 'Kuzulat → besi',
    aciklama: 'Kendi koyununa koç kat, kuzulat, sonra besiye al.',
    icon: '🐏',
    hazir: true,
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod3',
    no: 3,
    baslik: 'Damızlık kuzu',
    kisa: 'Genetik / yetiştirme',
    aciklama: 'Damızlık kalite, şecere ve seleksiyon odaklı.',
    icon: '🏆',
    hazir: true,
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod4',
    no: 4,
    baslik: 'Süt koyunculuğu',
    kisa: 'Sağım / laktasyon',
    aciklama: 'Sağmal sürü, sağım kaydı ve süt rasyonu.',
    icon: '🥛',
    hazir: true,
    href: '/(tabs)/yolculuk',
  },
];

const KEY = 'sy_aktif_urun_modu';

export async function getAktifModId(): Promise<UrunModId> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === 'mod1' || raw === 'mod2' || raw === 'mod3' || raw === 'mod4') return raw;
  return 'mod1';
}

export async function setAktifModId(id: UrunModId): Promise<void> {
  await AsyncStorage.setItem(KEY, id);
}

export function getMod(id: UrunModId): UrunMod {
  return URUN_MODLARI.find((m) => m.id === id) ?? URUN_MODLARI[0];
}
