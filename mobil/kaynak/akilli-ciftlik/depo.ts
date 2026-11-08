import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AkilliCiftlikDepo, AkilliCiftlikDurum } from './tipler';
import { AKILLI_CIFTLIK_DEPO_ANAHTAR } from './tipler';

const BOS: AkilliCiftlikDepo = { surum: 1, oyun: null };

export async function oyunOku(): Promise<AkilliCiftlikDepo> {
  const raw = await AsyncStorage.getItem(AKILLI_CIFTLIK_DEPO_ANAHTAR);
  if (!raw) return { ...BOS };
  try {
    const p = JSON.parse(raw) as AkilliCiftlikDepo;
    if (p?.surum !== 1) return { ...BOS };
    return p;
  } catch {
    return { ...BOS };
  }
}

export async function oyunKaydet(oyun: AkilliCiftlikDurum | null): Promise<void> {
  const depo: AkilliCiftlikDepo = { surum: 1, oyun };
  await AsyncStorage.setItem(AKILLI_CIFTLIK_DEPO_ANAHTAR, JSON.stringify(depo));
}

export async function oyunSifirla(): Promise<void> {
  await AsyncStorage.removeItem(AKILLI_CIFTLIK_DEPO_ANAHTAR);
}

export function parseOyunDepo(raw: string): AkilliCiftlikDepo {
  return JSON.parse(raw) as AkilliCiftlikDepo;
}
