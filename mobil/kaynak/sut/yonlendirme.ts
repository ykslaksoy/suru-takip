import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sy_mod4_yonlendirme';

export type SutYonlendirme = {
  pazar: boolean;
  kuzu: boolean;
  ev: boolean;
  notes: string;
  guncelleme: string;
};

const BOS: SutYonlendirme = {
  pazar: false,
  kuzu: false,
  ev: false,
  notes: '',
  guncelleme: '',
};

export async function getSutYonlendirme(): Promise<SutYonlendirme> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...BOS };
  try {
    const p = JSON.parse(raw) as SutYonlendirme;
    return {
      pazar: !!p.pazar,
      kuzu: !!p.kuzu,
      ev: !!p.ev,
      notes: typeof p.notes === 'string' ? p.notes : '',
      guncelleme: typeof p.guncelleme === 'string' ? p.guncelleme : '',
    };
  } catch {
    return { ...BOS };
  }
}

export async function saveSutYonlendirme(p: Partial<SutYonlendirme>): Promise<SutYonlendirme> {
  const cur = await getSutYonlendirme();
  const next: SutYonlendirme = {
    ...cur,
    ...p,
    guncelleme: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function yonlendirmeTamamMi(y: SutYonlendirme): boolean {
  return y.pazar || y.kuzu || y.ev;
}
