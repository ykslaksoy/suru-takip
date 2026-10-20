import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mod5AdimId =
  | 'gruplar'
  | 'ureme'
  | 'sagim'
  | 'laktasyon'
  | 'rasyon-sut'
  | 'saglik'
  | 'yonlendirme'
  | 'damizlik-besi'
  | 'kuzu-alim'
  | 'karantina'
  | 'asi-giris'
  | 't0-besi'
  | 'rasyon-besi'
  | 'besi-donem'
  | 'tartim-besi'
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
    baslik: 'Süt sürüsü grupları',
    aciklama: 'Sağmal / kuru / gebe gruplarını ayır.',
    href: '/(tabs)/suru',
  },
  {
    id: 'ureme',
    sira: 1,
    baslik: 'Üreme / kuzulatma (isteğe bağlı)',
    aciklama: 'Süt sürüsünde çiftleşme ve doğum — ortak kayıt.',
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
    id: 'rasyon-sut',
    sira: 4,
    baslik: 'Süt rasyonu',
    aciklama: 'Sağmal / kuru dönem yem planı.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'saglik',
    sira: 5,
    baslik: 'Meme / sağlık',
    aciklama: 'Meme sağlığı, agalaksi / ORF programı.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'yonlendirme',
    sira: 6,
    baslik: 'Süt yönlendirme',
    aciklama: 'Kuruya alma, sütten kesme uyarıları.',
    href: '/(tabs)/akilli-kuzu',
  },
  {
    id: 'damizlik-besi',
    sira: 7,
    baslik: 'Damızlık / besi ayır',
    aciklama:
      'Süt sürüsünde doğan kuzular: damızlık seç veya toplu “Besiye al” — satın alınan kuzularla aynı besi yolu.',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'kuzu-alim',
    sira: 8,
    baslik: 'Kuzu alım (besi)',
    aciklama: 'Satın alınan kuzuları sisteme gir — ana besi hattı.',
    href: '/hayvan/ekle',
  },
  {
    id: 'karantina',
    sira: 9,
    baslik: 'Karantina',
    aciklama: 'Giriş kuzuları: yonca + su, günlük kontrol.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'asi-giris',
    sira: 10,
    baslik: 'Giriş aşı paketi',
    aciklama: 'İvermektin, albendazol, karma, selenyum-E.',
    href: '/gorevler/asi',
  },
  {
    id: 't0-besi',
    sira: 11,
    baslik: 'Besi T1 tartım',
    aciklama: 'Besi başı kilosu (satın alım + besiye alınan kuzular).',
    href: '/(tabs)/suru',
  },
  {
    id: 'rasyon-besi',
    sira: 12,
    baslik: 'Besi rasyonu',
    aciklama: 'Besi grubu günlük yem planı.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'besi-donem',
    sira: 13,
    baslik: 'Besi dönemi',
    aciklama: 'Yem stok çıkışı ve takip.',
    href: '/(tabs)/stok',
  },
  {
    id: 'tartim-besi',
    sira: 14,
    baslik: 'Besi ara tartım',
    aciklama: 'ADG ve FCR için ara tartım.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rapor',
    sira: 15,
    baslik: 'Süt + besi raporu',
    aciklama: 'Litre, laktasyon ve besi metrik özeti.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod5Ilerleme = { tamamlanan: Mod5AdimId[]; guncelleme: string };

const KEY = 'sy_mod5_ilerleme_v2';

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
