import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod6AdimId =
  | 'aday'
  | 'kimlik'
  | 'buyume'
  | 'saglik'
  | 'seleksiyon'
  | 'satis'
  | 'yonlendirme';

export type Mod6Adim = {
  id: Mod6AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD6_ADIMLAR: Mod6Adim[] = [
  {
    id: 'aday',
    sira: 0,
    baslik: 'Sütçü damızlık aday',
    aciklama: 'Üstün genotip / ırk tipi adayları seç.',
    href: '/ciftlesme',
  },
  {
    id: 'kimlik',
    sira: 1,
    baslik: 'Kimlik / TÜRKVET',
    aciklama: 'Küpe, TÜRKVET no ve şecere alanlarını doldur.',
    href: '/turkvet-aktar',
  },
  {
    id: 'buyume',
    sira: 2,
    baslik: 'Büyüme tartımları',
    aciklama: 'Düzenli tartım ile büyüme takibi.',
    href: '/(tabs)/suru',
  },
  {
    id: 'saglik',
    sira: 3,
    baslik: 'Sağlık / aşı disiplini',
    aciklama: 'Hastalık ve aşı kayıtlarını eksiksiz tut.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'seleksiyon',
    sira: 4,
    baslik: 'Seleksiyon',
    aciklama: 'ADG, yapı, sağlık geçmişine göre ayır.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'satis',
    sira: 5,
    baslik: 'Damızlık satış hazırlığı',
    aciklama: 'Sertifika / satış için kayıtları toparla.',
    href: '/turkvet-aktar',
  },
  {
    id: 'yonlendirme',
    sira: 6,
    baslik: 'Aday mı, besi mi?',
    aciklama: 'Akıllı öneri: damızlıkta tut veya besiye ayır.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod6Ilerleme = { tamamlanan: Mod6AdimId[]; guncelleme: string };

const KEY = 'sy_mod6_ilerleme';

export async function getMod6Ilerleme(): Promise<Mod6Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const p = JSON.parse(raw) as Mod6Ilerleme;
    return { tamamlanan: Array.isArray(p.tamamlanan) ? p.tamamlanan : [], guncelleme: p.guncelleme || new Date().toISOString() };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod6Ilerleme(ilerleme: Mod6Ilerleme): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() }));
}

export async function adimTamamlaMod6(id: Mod6AdimId): Promise<Mod6Ilerleme> {
  const cur = await getMod6Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod6Ilerleme(cur);
  return cur;
}

export async function resetMod6Ilerleme(): Promise<Mod6Ilerleme> {
  const empty = { tamamlanan: [] as Mod6AdimId[], guncelleme: new Date().toISOString() };
  await saveMod6Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod6(adim: Mod6Adim, tamamlanan: Mod6AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD6_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod6(tamamlanan: Mod6AdimId[]): Mod6Adim | null {
  return MOD6_ADIMLAR.find((a) => adimAcikMiMod6(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}
