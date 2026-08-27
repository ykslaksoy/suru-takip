import AsyncStorage from '@react-native-async-storage/async-storage';

export type BesiAdimId =
  | 'alim'
  | 'karantina'
  | 'asi'
  | 't0'
  | 'rasyon'
  | 'besi'
  | 'tartim'
  | 'rapor';

export type BesiAdim = {
  id: BesiAdimId;
  sira: number;
  baslik: string;
  aciklama: string;
  href?: string;
};

export const MOD1_ADIMLAR: BesiAdim[] = [
  {
    id: 'alim',
    sira: 0,
    baslik: 'Kuzu alım',
    aciklama: 'Satın alınan kuzuları sisteme gir.',
    href: '/hayvan/ekle',
  },
  {
    id: 'karantina',
    sira: 1,
    baslik: 'Karantina',
    aciklama: 'İlk günler: sadece yonca + su, günlük kontrol.',
    href: '/(tabs)/saglik',
  },
  {
    id: 'asi',
    sira: 2,
    baslik: 'Aşılama',
    aciklama: 'Karantina sonrası aşıyı uygula ve stoktan düş.',
    href: '/(tabs)/saglik',
  },
  {
    id: 't0',
    sira: 3,
    baslik: 'İlk tartım (T0)',
    aciklama: 'Besi başlamadan T0 kilosunu kaydet.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rasyon',
    sira: 4,
    baslik: 'Rasyon başlat',
    aciklama: 'Günlük yem planı ve akıllı öneri.',
    href: '/(tabs)/rasyon',
  },
  {
    id: 'besi',
    sira: 5,
    baslik: 'Besi dönemi',
    aciklama: 'Takip, stok ve sağlık disiplinini sürdür.',
    href: '/(tabs)/stok',
  },
  {
    id: 'tartim',
    sira: 6,
    baslik: 'Ara / son tartım',
    aciklama: 'ADG ve FCR için ara tartımları gir.',
    href: '/(tabs)/suru',
  },
  {
    id: 'rapor',
    sira: 7,
    baslik: 'Metrik rapor',
    aciklama: 'ADG · FCR · maliyet · öneri vs gerçek.',
    href: '/(tabs)/akilli-kuzu',
  },
];

export type Mod1Ilerleme = {
  tamamlanan: BesiAdimId[];
  guncelleme: string;
};

const KEY = 'sy_mod1_ilerleme';

export async function getMod1Ilerleme(): Promise<Mod1Ilerleme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { tamamlanan: [], guncelleme: new Date().toISOString() };
  try {
    const parsed = JSON.parse(raw) as Mod1Ilerleme;
    return {
      tamamlanan: Array.isArray(parsed.tamamlanan) ? parsed.tamamlanan : [],
      guncelleme: parsed.guncelleme || new Date().toISOString(),
    };
  } catch {
    return { tamamlanan: [], guncelleme: new Date().toISOString() };
  }
}

export async function saveMod1Ilerleme(ilerleme: Mod1Ilerleme): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...ilerleme, guncelleme: new Date().toISOString() })
  );
}

export async function adimTamamla(id: BesiAdimId): Promise<Mod1Ilerleme> {
  const cur = await getMod1Ilerleme();
  if (!cur.tamamlanan.includes(id)) cur.tamamlanan.push(id);
  await saveMod1Ilerleme(cur);
  return cur;
}

export async function adimGeriAl(id: BesiAdimId): Promise<Mod1Ilerleme> {
  const cur = await getMod1Ilerleme();
  cur.tamamlanan = cur.tamamlanan.filter((x) => x !== id);
  await saveMod1Ilerleme(cur);
  return cur;
}

export async function resetMod1Ilerleme(): Promise<Mod1Ilerleme> {
  const empty = { tamamlanan: [] as BesiAdimId[], guncelleme: new Date().toISOString() };
  await saveMod1Ilerleme(empty);
  return empty;
}

/** Önceki adımlar tamamlanmadan kilitli */
export function adimAcikMi(adim: BesiAdim, tamamlanan: BesiAdimId[]): boolean {
  if (adim.sira === 0) return true;
  const oncekiler = MOD1_ADIMLAR.filter((a) => a.sira < adim.sira);
  return oncekiler.every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdim(tamamlanan: BesiAdimId[]): BesiAdim | null {
  return MOD1_ADIMLAR.find((a) => adimAcikMi(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null;
}

import type { AdimKanit, Mod1VeriDurum } from './veri-ilerleme';
import { tespitMod1VeriDurumu } from './veri-ilerleme';

export type Mod1BirlesikIlerleme = {
  tamamlanan: BesiAdimId[];
  /** Adım veri ile mi manuel mi kapandı */
  kaynak: Partial<Record<BesiAdimId, 'veri' | 'manuel'>>;
  kanitlar: AdimKanit[];
  ozet: Mod1VeriDurum['ozet'];
};

/** Veri tespiti + manuel onay — sırayı bozmadan birleştirir */
export async function getMod1BirlesikIlerleme(): Promise<Mod1BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod1Ilerleme(), tespitMod1VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: BesiAdimId[] = [];
  const kaynak: Partial<Record<BesiAdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD1_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD1_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
    if (!oncekiOk) break;

    if (autoSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'veri';
    } else if (manuelSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'manuel';
    } else {
      break;
    }
  }

  return { tamamlanan, kaynak, kanitlar: veri.kanitlar, ozet: veri.ozet };
}
