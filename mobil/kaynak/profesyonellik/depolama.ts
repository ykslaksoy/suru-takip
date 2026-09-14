import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type AsamaPaketBoyutu,
  VARSAYILAN_PAKET,
} from './asamalar';
import type { SistemCevaplari } from './analiz';

const KEY = 'sy_profesyonellik_v1';

export type ProfesyonellikDurum = {
  paket: AsamaPaketBoyutu;
  cevaplar: SistemCevaplari;
  /** Analiz sonucu aşama id */
  mevcutAsamaId: string | null;
  /** Onaylanan (görevleri açılan) aşama id’leri */
  onaylananAsamaIdler: string[];
  /** Onay → oluşturulan planlanan görev id’leri (asamaId → görevId[]) */
  gorevIdleri: Record<string, string[]>;
  guncelleme: string;
};

function bos(): ProfesyonellikDurum {
  return {
    paket: VARSAYILAN_PAKET,
    cevaplar: {},
    mevcutAsamaId: null,
    onaylananAsamaIdler: [],
    gorevIdleri: {},
    guncelleme: new Date().toISOString(),
  };
}

export async function getProfesyonellikDurum(): Promise<ProfesyonellikDurum> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return bos();
  try {
    const p = JSON.parse(raw) as Partial<ProfesyonellikDurum>;
    return {
      paket: p.paket === 10 ? 10 : 5,
      cevaplar: p.cevaplar && typeof p.cevaplar === 'object' ? p.cevaplar : {},
      mevcutAsamaId: p.mevcutAsamaId ?? null,
      onaylananAsamaIdler: Array.isArray(p.onaylananAsamaIdler) ? p.onaylananAsamaIdler : [],
      gorevIdleri: p.gorevIdleri && typeof p.gorevIdleri === 'object' ? p.gorevIdleri : {},
      guncelleme: p.guncelleme || new Date().toISOString(),
    };
  } catch {
    return bos();
  }
}

async function yaz(d: ProfesyonellikDurum): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...d, guncelleme: new Date().toISOString() })
  );
}

export async function setProfesyonellikPaket(paket: AsamaPaketBoyutu): Promise<ProfesyonellikDurum> {
  const d = await getProfesyonellikDurum();
  const next = { ...d, paket };
  await yaz(next);
  return next;
}

export async function kaydetSistemCevaplari(
  cevaplar: SistemCevaplari,
  mevcutAsamaId: string
): Promise<ProfesyonellikDurum> {
  const d = await getProfesyonellikDurum();
  const next: ProfesyonellikDurum = {
    ...d,
    cevaplar: { ...d.cevaplar, ...cevaplar },
    mevcutAsamaId,
  };
  await yaz(next);
  return next;
}

export async function asamaOnaylandiKaydet(
  asamaId: string,
  gorevIdleri: string[]
): Promise<ProfesyonellikDurum> {
  const d = await getProfesyonellikDurum();
  const onaylanan = d.onaylananAsamaIdler.includes(asamaId)
    ? d.onaylananAsamaIdler
    : [...d.onaylananAsamaIdler, asamaId];
  const next: ProfesyonellikDurum = {
    ...d,
    onaylananAsamaIdler: onaylanan,
    gorevIdleri: { ...d.gorevIdleri, [asamaId]: gorevIdleri },
    // Onaylanan aşama artık “mevcut” sayılır
    mevcutAsamaId: asamaId,
  };
  await yaz(next);
  return next;
}

export async function profesyonellikSifirla(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
