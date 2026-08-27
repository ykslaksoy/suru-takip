import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod4AdimId =
  | 'gruplar'
  | 'ureme'
  | 'sagim'
  | 'laktasyon'
  | 'rasyon'
  | 'saglik'
  | 'yonlendirme'
  | 'rapor';

export type Mod4Adim = {
  id: Mod4AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD4_ADIMLAR: Mod4Adim[] = [
  {
    id: 'gruplar',
    sira: 0,
    baslik: 'Sürü grupları',
    aciklama: 'Sağmal / kuru / gebe gruplarını ayır.',
    href: '/(tabs)/suru',
  },
  {
    id: 'ureme',
    sira: 1,
    baslik: 'Üreme / kuzulatma',
    aciklama: 'Çoğaltma ve kuzulatma kayıtları.',
    href: '/hayvan/ekle',
  },
  {
    id: 'sagim',
    sira: 2,
    baslik: 'Sağım kaydı',
    aciklama: 'Günlük/periyodik litre girişi.',
    href: '/(tabs)/suru',
  },
  {
    id: 'laktasyon',
    sira: 3,
    baslik: 'Laktasyon takibi',
    aciklama: 'Laktasyon dönemi ve verim eğrisi.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'rasyon',
    sira: 4,
    baslik: 'Dönemsel rasyon',
    aciklama: 'Sağmal / kuru dönem yem planı.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'saglik',
    sira: 5,
    baslik: 'Meme / sağlık',
    aciklama: 'Meme sağlığı ve tedavi kayıtları.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'yonlendirme',
    sira: 6,
    baslik: 'Akıllı yönlendirme',
    aciklama: 'Kuruya alma, doğum, sütten kesme uyarıları.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'rapor',
    sira: 7,
    baslik: 'Süt raporu',
    aciklama: 'Litre, laktasyon ve maliyet özeti.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod4Ilerleme = { tamamlanan: Mod4AdimId[]; guncelleme: string };

const KEY = 'sy_mod4_ilerleme';

export async function getMod4Ilerleme(): Promise<Mod4Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const p = JSON.parse(raw) as Mod4Ilerleme;
    return { tamamlanan: Array.isArray(p.tamamlanan) ? p.tamamlanan : [], guncelleme: p.guncelleme || new Date().toISOString() };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod4Ilerleme(ilerleme: Mod4Ilerleme): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() }));
}

export async function adimTamamlaMod4(id: Mod4AdimId): Promise<Mod4Ilerleme> {
  const cur = await getMod4Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod4Ilerleme(cur);
  return cur;
}

export async function resetMod4Ilerleme(): Promise<Mod4Ilerleme> {
  const empty = { tamamlanan: [] as Mod4AdimId[], guncelleme: new Date().toISOString() };
  await saveMod4Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod4(adim: Mod4Adim, tamamlanan: Mod4AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD4_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod4(tamamlanan: Mod4AdimId[]): Mod4Adim | null {
  return MOD4_ADIMLAR.find((a) => adimAcikMiMod4(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}
