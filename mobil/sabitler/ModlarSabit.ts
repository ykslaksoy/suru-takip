export type UrunModId = 'mod1' | 'mod2' | 'mod3' | 'mod4';

/** mod1 tam · mod2–4 pilot · yakinda kilitli */
export type ModSeviye = 'tam' | 'pilot' | 'yakinda';

export type UrunMod = {
  id: UrunModId;
  no: number;
  baslik: string;
  kisa: string;
  aciklama: string;
  icon: string;
  hazir: boolean;
  seviye: ModSeviye;
  href: string | null;
};

export const URUN_MODLARI: UrunMod[] = [
  {
    id: 'mod1',
    no: 1,
    baslik: 'Kuzu alarak besi',
    kisa: 'Satın al → besi',
    aciklama: '2–3 aylık kuzu al, karantina, aşı, tartım, rasyon.',
    icon: '🛒',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod2',
    no: 2,
    baslik: 'Koç katarak besi',
    kisa: 'Kuzulat → besi',
    aciklama: 'Kendi koyununa koç kat, kuzulat, sonra besiye al. (Pilot)',
    icon: '🐏',
    hazir: true,
    seviye: 'pilot',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod3',
    no: 3,
    baslik: 'Damızlık kuzu',
    kisa: 'Genetik / yetiştirme',
    aciklama: 'Damızlık kalite, şecere ve seleksiyon odaklı. (Pilot)',
    icon: '🏆',
    hazir: true,
    seviye: 'pilot',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod4',
    no: 4,
    baslik: 'Süt koyunculuğu',
    kisa: 'Sağım / laktasyon',
    aciklama: 'Sağmal sürü, sağım kaydı ve süt rasyonu. (Pilot)',
    icon: '🥛',
    hazir: true,
    seviye: 'pilot',
    href: '/(tabs)/yolculuk',
  },
];

export function getMod(id: UrunModId): UrunMod {
  return URUN_MODLARI.find((m) => m.id === id) ?? URUN_MODLARI[0];
}
