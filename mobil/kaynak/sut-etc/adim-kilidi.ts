import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod7AdimId =
  | 'kol-etiket'
  | 'gruplar-sut'
  | 'ureme'
  | 'sagim'
  | 'laktasyon'
  | 'rasyon-sut'
  | 'saglik-sut'
  | 'damizlik-besi'
  | 'gruplar-et'
  | 'katim'
  | 'gebelik'
  | 'kuzulatma'
  | 'ilk-gunler'
  | 'besiye-aktar-et'
  | 'kuzu-alim'
  | 'karantina'
  | 'asi-giris'
  | 't0-besi'
  | 'rasyon-besi'
  | 'besi-donem'
  | 'tartim-besi'
  | 'rapor';

export type Mod7Adim = {
  id: Mod7AdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD7_ADIMLAR: Mod7Adim[] = [
  {
    id: 'kol-etiket',
    sira: 0,
    baslik: 'Süt / et sürüsü etiketi',
    aciklama: 'Hayvan ve padokları süt veya et kolu olarak işaretle.',
    href: '/(tabs)/suru',
  },
  {
    id: 'gruplar-sut',
    sira: 1,
    baslik: 'Süt sürüsü grupları',
    aciklama: 'Sağmal / kuru / gebe (süt kolu).',
    href: '/(tabs)/suru',
  },
  {
    id: 'ureme',
    sira: 2,
    baslik: 'Çiftleşme ve doğum (ortak)',
    aciklama: 'Her iki kol için ortak üreme kaydı.',
    href: '/ciftlesme',
  },
  {
    id: 'sagim',
    sira: 3,
    baslik: 'Sağım',
    aciklama: 'Süt kolu litre kaydı.',
    href: '/(tabs)/suru',
  },
  {
    id: 'laktasyon',
    sira: 4,
    baslik: 'Laktasyon',
    aciklama: 'Süt kolu verim takibi.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'rasyon-sut',
    sira: 5,
    baslik: 'Süt rasyonu',
    aciklama: 'Sağmal / kuru yem planı.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'saglik-sut',
    sira: 6,
    baslik: 'Meme sağlığı / agalaksi',
    aciklama: 'Süt kolu sağlık programı.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'damizlik-besi',
    sira: 7,
    baslik: 'Süt kuzusu damızlık / besi',
    aciklama: 'Damızlık seçilmeyenler besi yoluna — satın alım ile aynı adımlar.',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'gruplar-et',
    sira: 8,
    baslik: 'Et sürüsü',
    aciklama: 'Dişi sürü ve koç (et kolu).',
    href: '/(tabs)/suru',
  },
  {
    id: 'katim',
    sira: 9,
    baslik: 'Koç katım',
    aciklama: 'Et kolunda katım kaydı.',
    href: '/(tabs)/suru',
  },
  {
    id: 'gebelik',
    sira: 10,
    baslik: 'Gebelik',
    aciklama: 'Et kolu gebe takibi.',
    href: '/ciftlesme',
  },
  {
    id: 'kuzulatma',
    sira: 11,
    baslik: 'Kuzulatma',
    aciklama: 'Et kolu doğum ve anne bağlama.',
    href: '/hayvan/ekle',
  },
  {
    id: 'ilk-gunler',
    sira: 12,
    baslik: 'İlk günler',
    aciklama: 'Kolostrum ve zayıf kuzu kontrolü.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'besiye-aktar-et',
    sira: 13,
    baslik: 'Et kolu kuzuyu besiye al',
    aciklama: 'Et sürüsünde doğan kuzular besi grubuna.',
    href: '/(tabs)/suru',
  },
  {
    id: 'kuzu-alim',
    sira: 14,
    baslik: 'Kuzu alım (besi)',
    aciklama: 'İsteğe bağlı satın alınan besi kuzuları.',
    href: '/hayvan/ekle',
  },
  {
    id: 'karantina',
    sira: 15,
    baslik: 'Besi karantina',
    aciklama: 'Giriş kuzuları izolasyon.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'asi-giris',
    sira: 16,
    baslik: 'Besi giriş aşısı',
    aciklama: 'Karma, ivermektin, albendazol, selen-E.',
    href: '/gorevler/asi',
  },
  {
    id: 't0-besi',
    sira: 17,
    baslik: 'Besi T1',
    aciklama: 'Ortak besi tartımı.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rasyon-besi',
    sira: 18,
    baslik: 'Besi rasyonu',
    href: '/(tabs)/rasyon',
    aciklama: 'Besi grubu yem planı.',
  },
  {
    id: 'besi-donem',
    sira: 19,
    baslik: 'Besi dönemi',
    aciklama: 'Stok ve günlük takip.',
    href: '/(tabs)/stok',
  },
  {
    id: 'tartim-besi',
    sira: 20,
    baslik: 'Besi ara tartım',
    aciklama: 'ADG / FCR.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rapor',
    sira: 21,
    baslik: 'Süt + etçi rapor',
    aciklama: 'Her iki kol ve besi özeti.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod7Ilerleme = { tamamlanan: Mod7AdimId[]; guncelleme: string };

const KEY = 'sy_mod7_ilerleme';

export async function getMod7Ilerleme(): Promise<Mod7Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const p = JSON.parse(raw) as Mod7Ilerleme;
    return { tamamlanan: Array.isArray(p.tamamlanan) ? p.tamamlanan : [], guncelleme: p.guncelleme || new Date().toISOString() };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod7Ilerleme(ilerleme: Mod7Ilerleme): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() }));
}

export async function adimTamamlaMod7(id: Mod7AdimId): Promise<Mod7Ilerleme> {
  const cur = await getMod7Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod7Ilerleme(cur);
  return cur;
}

export async function resetMod7Ilerleme(): Promise<Mod7Ilerleme> {
  const empty = { tamamlanan: [] as Mod7AdimId[], guncelleme: new Date().toISOString() };
  await saveMod7Ilerleme(empty);
  return empty;
}

export function adimAcikMiMod7(adim: Mod7Adim, tamamlanan: Mod7AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD7_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod7(tamamlanan: Mod7AdimId[]): Mod7Adim | null {
  return MOD7_ADIMLAR.find((a) => adimAcikMiMod7(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}
