import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod5AdimId =
  | 'gruplar'
  | 'ureme'
  | 'sagim'
  | 'laktasyon'
  | 'rasyon'
  | 'saglik'
  | 'besiye-aktar'
  | 'asi-kuzu'
  | 't0-kuzu'
  | 'tartim-kuzu'
  | 'yonlendirme'
  | 'rapor';

export type Mod5Adim = {
  id: Mod5AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD5_ADIMLAR: Mod5Adim[] = [
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
    aciklama: 'Çiftleşme, gebelik ve doğum kayıtları.',
    href: '/ciftlesme',
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
    id: 'besiye-aktar',
    sira: 6,
    baslik: 'Kuzuyu besiye al',
    aciklama: 'Sütten kesilen / yaş uygun kuzuları besi grubuna al.',
    href: '/(tabs)/suru',
  },
  {
    id: 'asi-kuzu',
    sira: 7,
    baslik: 'Besi kuzu aşısı',
    aciklama: 'Besiye alınan kuzulara giriş paketi.',
    href: '/gorevler/asi',
  },
  {
    id: 't0-kuzu',
    sira: 8,
    baslik: 'Besi T1 tartım',
    aciklama: 'Besi başı kilosu.',
    href: '/(tabs)/suru',
  },
  {
    id: 'tartim-kuzu',
    sira: 9,
    baslik: 'Besi ara tartım',
    aciklama: 'ADG ve FCR için ara tartım.',
    href: '/(tabs)/suru',
  },
  {
    id: 'yonlendirme',
    sira: 10,
    baslik: 'Akıllı yönlendirme',
    aciklama: 'Kuruya alma, doğum, sütten kesme uyarıları.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'rapor',
    sira: 11,
    baslik: 'Süt + besi raporu',
    aciklama: 'Litre, laktasyon ve besi metrik özeti.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod5Ilerleme = { tamamlanan: Mod5AdimId[]; guncelleme: string };

const KEY = 'sy_mod5_ilerleme';

export async function getMod5Ilerleme(): Promise<Mod5Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const p = JSON.parse(raw) as Mod5Ilerleme;
    return {
      tamamlanan: Array.isArray(p.tamamlanan) ? p.tamamlanan : [],
      guncelleme: p.guncelleme || new Date().toISOString(),
    };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod5Ilerleme(ilerleme: Mod5Ilerleme): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() }));
}

export async function adimTamamlaMod5(id: Mod5AdimId): Promise<Mod5Ilerleme> {
  const cur = await getMod5Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod5Ilerleme(cur);
  return cur;
}

export async function resetMod5Ilerleme(): Promise<Mod5Ilerleme> {
  const empty = { tamamlanan: [] as Mod5AdimId[], guncelleme: new Date().toISOString() };
  await saveMod5Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod5(adim: Mod5Adim, tamamlanan: Mod5AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD5_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod5(tamamlanan: Mod5AdimId[]): Mod5Adim | null {
  return MOD5_ADIMLAR.find((a) => adimAcikMiMod5(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}
