import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod3AdimId =
  | 'aday'
  | 'kimlik'
  | 'buyume'
  | 'saglik'
  | 'seleksiyon'
  | 'satis'
  | 'yonlendirme';

export type Mod3Adim = {
  id: Mod3AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD3_ADIMLAR: Mod3Adim[] = [
  {
    id: 'aday',
    sira: 0,
    baslik: 'Damızlık aday',
    aciklama: 'Üstün genotip / ırk tipi adayları seç.',
    href: '/(tabs)/suru',
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

export type Mod3Ilerleme = { tamamlanan: Mod3AdimId[]; guncelleme: string };

const KEY = 'sy_mod3_ilerleme';

export async function getMod3Ilerleme(): Promise<Mod3Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const p = JSON.parse(raw) as Mod3Ilerleme;
    return { tamamlanan: Array.isArray(p.tamamlanan) ? p.tamamlanan : [], guncelleme: p.guncelleme || new Date().toISOString() };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod3Ilerleme(ilerleme: Mod3Ilerleme): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() }));
}

export async function adimTamamlaMod3(id: Mod3AdimId): Promise<Mod3Ilerleme> {
  const cur = await getMod3Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod3Ilerleme(cur);
  return cur;
}

export async function resetMod3Ilerleme(): Promise<Mod3Ilerleme> {
  const empty = { tamamlanan: [] as Mod3AdimId[], guncelleme: new Date().toISOString() };
  await saveMod3Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod3(adim: Mod3Adim, tamamlanan: Mod3AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD3_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod3(tamamlanan: Mod3AdimId[]): Mod3Adim | null {
  return MOD3_ADIMLAR.find((a) => adimAcikMiMod3(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}
