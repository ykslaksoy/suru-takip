import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod2AdimId =
  | 'suru-kayit'
  | 'katim'
  | 'gebelik'
  | 'kuzulatma'
  | 'ilk-gunler'
  | 'besiye-aktar'
  | 'asi'
  | 't0'
  | 'rasyon'
  | 'tartim'
  | 'rapor';

export type Mod2Adim = {
  id: Mod2AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD2_ADIMLAR: Mod2Adim[] = [
  {
    id: 'suru-kayit',
    sira: 0,
    baslik: 'Dişi sürü + koç',
    aciklama: 'Damızlık dişileri ve koçu sisteme gir.',
    href: '/hayvan/ekle',
  },
  {
    id: 'katim',
    sira: 1,
    baslik: 'Koç katım',
    aciklama: 'Katım tarihi, koç ve grup/padok kaydı.',
    href: '/(tabs)/suru',
  },
  {
    id: 'gebelik',
    sira: 2,
    baslik: 'Gebelik takibi',
    aciklama: 'Gebe işaretle; doğuma yaklaşınca uyar.',
    href: '/(tabs)/suru',
  },
  {
    id: 'kuzulatma',
    sira: 3,
    baslik: 'Kuzulatma',
    aciklama: 'Doğan kuzuyu anne ile bağla, padok ayır.',
    href: '/hayvan/ekle',
  },
  {
    id: 'ilk-gunler',
    sira: 4,
    baslik: 'İlk günler',
    aciklama: 'Kolostrum, zayıf kuzu kontrolü.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'besiye-aktar',
    sira: 5,
    baslik: 'Besiye alma',
    aciklama: 'Yaşı gelen kuzuları besi grubuna al.',
    href: '/(tabs)/suru',
  },
  {
    id: 'asi',
    sira: 6,
    baslik: 'Aşılama',
    aciklama: 'Besiye alınan kuzulara aşı.',
    href: '/(tabs)/saglik',
  },
  {
    id: 't0',
    sira: 7,
    baslik: 'İlk tartım (T1)',
    aciklama: 'Besi başı kilosu.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rasyon',
    sira: 8,
    baslik: 'Rasyon',
    aciklama: 'Günlük yem planı.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'tartim',
    sira: 9,
    baslik: 'Ara / son tartım',
    aciklama: 'ADG ve FCR için ara tartım.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rapor',
    sira: 10,
    baslik: 'Metrik rapor',
    aciklama: 'ADG · FCR · kâr özeti.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod2Ilerleme = {
  tamamlanan: Mod2AdimId[];
  guncelleme: string;
};

const KEY = 'sy_mod2_ilerleme';

export async function getMod2Ilerleme(): Promise<Mod2Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const parsed = JSON.parse(raw) as Mod2Ilerleme;
    return {
      tamamlanan: Array.isArray(parsed.tamamlanan) ? parsed.tamamlanan : [],
      guncelleme: parsed.guncelleme || new Date().toISOString(),
    };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod2Ilerleme(ilerleme: Mod2Ilerleme): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() })
  );
}

export async function adimTamamlaMod2(id: Mod2AdimId): Promise<Mod2Ilerleme> {
  const cur = await getMod2Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod2Ilerleme(cur);
  return cur;
}

export async function resetMod2Ilerleme(): Promise<Mod2Ilerleme> {
  const empty = { tamamlanan: [] as Mod2AdimId[], guncelleme: new Date().toISOString() };
  await saveMod2Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod2(adim: Mod2Adim, tamamlanan: Mod2AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD2_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod2(tamamlanan: Mod2AdimId[]): Mod2Adim | null {
  return (
    MOD2_ADIMLAR.find((a) => adimAcikMiMod2(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null
  );
}
