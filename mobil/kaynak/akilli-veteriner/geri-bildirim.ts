/**
 * Teşhis geri bildirimi — “işe yaradı / yaramadı” (yerel öğrenme için ham veri).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_vet_geri_bildirim_v1';

export type VetGeriBildirim = {
  id: string;
  tarih: string;
  teshisId: string;
  teshisAdi: string;
  faydalı: boolean;
  not: string;
};

async function oku(): Promise<VetGeriBildirim[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VetGeriBildirim[];
  } catch {
    return [];
  }
}

export async function geriBildirimKaydet(input: {
  teshisId: string;
  teshisAdi: string;
  faydalı: boolean;
  not?: string;
}): Promise<VetGeriBildirim> {
  const kayit: VetGeriBildirim = {
    id: uuidv4(),
    tarih: new Date().toISOString(),
    teshisId: input.teshisId,
    teshisAdi: input.teshisAdi,
    faydalı: input.faydalı,
    not: input.not?.trim() ?? '',
  };
  const list = await oku();
  list.unshift(kayit);
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  return kayit;
}

export async function geriBildirimListele(): Promise<VetGeriBildirim[]> {
  return oku();
}

export async function geriBildirimOzet(): Promise<{ toplam: number; faydalı: number; orani: number }> {
  const list = await oku();
  const faydalı = list.filter((x) => x.faydalı).length;
  return {
    toplam: list.length,
    faydalı,
    orani: list.length === 0 ? 0 : Math.round((faydalı / list.length) * 100),
  };
}
