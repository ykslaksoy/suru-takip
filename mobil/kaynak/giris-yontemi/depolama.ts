import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VARSAYILAN_GIRIS_YONTEMI,
  type GirisYontemiTercih,
  type KuzuSecimYontemi,
  type TartimGirisYontemi,
} from './tipler';
import { KUZU_SECIM_SECENEKLER, TARTIM_GIRIS_SECENEKLER } from './tipler';

const KEY = 'sy_giris_yontemi_tercih';

const GECERLI_KUZU = new Set<KuzuSecimYontemi>(KUZU_SECIM_SECENEKLER.map((s) => s.id));
const GECERLI_TARTIM = new Set<TartimGirisYontemi>(TARTIM_GIRIS_SECENEKLER.map((s) => s.id));

function normalize(raw: Partial<GirisYontemiTercih>): GirisYontemiTercih {
  const kuzuSecim =
    raw.kuzuSecim && GECERLI_KUZU.has(raw.kuzuSecim) ? raw.kuzuSecim : VARSAYILAN_GIRIS_YONTEMI.kuzuSecim;
  const tartimGiris =
    raw.tartimGiris && GECERLI_TARTIM.has(raw.tartimGiris)
      ? raw.tartimGiris
      : VARSAYILAN_GIRIS_YONTEMI.tartimGiris;
  return {
    kuzuSecim,
    tartimGiris,
    kurulumTamam: raw.kurulumTamam === true,
    guncelleme: raw.guncelleme,
  };
}

export async function getGirisYontemiTercih(): Promise<GirisYontemiTercih> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...VARSAYILAN_GIRIS_YONTEMI };
  try {
    return normalize(JSON.parse(raw) as Partial<GirisYontemiTercih>);
  } catch {
    return { ...VARSAYILAN_GIRIS_YONTEMI };
  }
}

export async function saveGirisYontemiTercih(
  tercih: Partial<GirisYontemiTercih> & Pick<GirisYontemiTercih, 'kuzuSecim' | 'tartimGiris'>,
): Promise<GirisYontemiTercih> {
  const mevcut = await getGirisYontemiTercih();
  const birlesik = normalize({
    ...mevcut,
    ...tercih,
    guncelleme: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(birlesik));
  return birlesik;
}

export async function girisYontemiKurulumTamamla(
  kuzuSecim: KuzuSecimYontemi,
  tartimGiris: TartimGirisYontemi,
): Promise<GirisYontemiTercih> {
  return saveGirisYontemiTercih({ kuzuSecim, tartimGiris, kurulumTamam: true });
}

export async function girisYontemiKurulumTamamMi(): Promise<boolean> {
  const t = await getGirisYontemiTercih();
  return t.kurulumTamam;
}

export async function resetGirisYontemiTercih(): Promise<GirisYontemiTercih> {
  await AsyncStorage.removeItem(KEY);
  return { ...VARSAYILAN_GIRIS_YONTEMI };
}
