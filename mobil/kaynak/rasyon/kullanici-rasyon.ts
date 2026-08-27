import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_kullanici_rasyonlar';

export type RasyonBilesen = {
  id: string;
  ad: string;
  miktarKg: number;
  fiyatKg: number;
};

export type KullaniciRasyon = {
  id: string;
  ad: string;
  bilesenler: RasyonBilesen[];
  guncelleme: string;
};

export type RasyonMaliyetOzeti = {
  toplamKg: number;
  toplamMaliyet: number;
  maliyetKg: number;
};

async function oku(): Promise<KullaniciRasyon[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as KullaniciRasyon[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: KullaniciRasyon[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getKullaniciRasyonlari(): Promise<KullaniciRasyon[]> {
  return oku();
}

export async function upsertKullaniciRasyon(
  input: Omit<KullaniciRasyon, 'id' | 'guncelleme'> & { id?: string }
): Promise<KullaniciRasyon> {
  const list = await oku();
  const kayit: KullaniciRasyon = {
    id: input.id ?? uuidv4(),
    ad: input.ad.trim() || 'Benim rasyonum',
    bilesenler: input.bilesenler,
    guncelleme: new Date().toISOString(),
  };
  const idx = list.findIndex((r) => r.id === kayit.id);
  if (idx >= 0) list[idx] = kayit;
  else list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function silKullaniciRasyon(id: string): Promise<void> {
  await yaz((await oku()).filter((r) => r.id !== id));
}

export function rasyonMaliyetOzeti(r: KullaniciRasyon): RasyonMaliyetOzeti {
  const toplamKg = r.bilesenler.reduce((s, b) => s + (b.miktarKg || 0), 0);
  const toplamMaliyet = r.bilesenler.reduce((s, b) => s + (b.miktarKg || 0) * (b.fiyatKg || 0), 0);
  return {
    toplamKg: Math.round(toplamKg * 100) / 100,
    toplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
    maliyetKg: toplamKg > 0 ? Math.round((toplamMaliyet / toplamKg) * 100) / 100 : 0,
  };
}
