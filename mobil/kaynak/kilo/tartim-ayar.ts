/** Hızlı tartım ayarları — kalıcı depo */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { VARSAYILAN_TARTIM_AYAR, type TartimAyar } from './hizli-tartim';

const KEY = 'sy_tartim_ayar_v1';

export async function getTartimAyar(): Promise<TartimAyar> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return { ...VARSAYILAN_TARTIM_AYAR };
  try {
    return { ...VARSAYILAN_TARTIM_AYAR, ...(JSON.parse(raw) as Partial<TartimAyar>) };
  } catch {
    return { ...VARSAYILAN_TARTIM_AYAR };
  }
}

export async function saveTartimAyar(a: TartimAyar): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(a));
}

