import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { VakaPaketi } from './vaka-paketi';

const KEY = 'sy_vet_vakalar_v1';

export type VetTalimat = {
  id: string;
  metin: string;
  ilac: string;
  bekletmeGun: number;
  acil: boolean;
  createdAt: string;
  uygulandi: boolean;
  uygulamaNotu: string;
};

export type VetVakaDurum = 'gonderildi' | 'yanit_bekliyor' | 'talimat_verildi' | 'kapandi';

export type VetVakaKanal = 'program' | 'whatsapp';

export type VetVakaKaydi = {
  id: string;
  paket: VakaPaketi;
  kanal: VetVakaKanal;
  durum: VetVakaDurum;
  gonderimZamani: string;
  vetAd: string;
  talimat: VetTalimat | null;
  whatsappGonderildi: boolean;
};

async function oku(): Promise<VetVakaKaydi[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as VetVakaKaydi[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: VetVakaKaydi[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getVetVakalar(): Promise<VetVakaKaydi[]> {
  return (await oku()).sort(
    (a, b) => b.gonderimZamani.localeCompare(a.gonderimZamani)
  );
}

export async function getVetVaka(id: string): Promise<VetVakaKaydi | null> {
  return (await oku()).find((v) => v.id === id) ?? null;
}

export async function programVakaKaydet(
  paket: VakaPaketi,
  vetAd: string
): Promise<VetVakaKaydi> {
  const kayit: VetVakaKaydi = {
    id: uuidv4(),
    paket,
    kanal: 'program',
    durum: 'yanit_bekliyor',
    gonderimZamani: new Date().toISOString(),
    vetAd,
    talimat: null,
    whatsappGonderildi: false,
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function whatsappVakaKaydet(
  paket: VakaPaketi,
  vetAd: string
): Promise<VetVakaKaydi> {
  const kayit: VetVakaKaydi = {
    id: uuidv4(),
    paket,
    kanal: 'whatsapp',
    durum: 'gonderildi',
    gonderimZamani: new Date().toISOString(),
    vetAd,
    talimat: null,
    whatsappGonderildi: true,
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function vakaTalimatGuncelle(
  vakaId: string,
  talimat: VetTalimat
): Promise<VetVakaKaydi | null> {
  const list = await oku();
  const idx = list.findIndex((v) => v.id === vakaId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    talimat,
    durum: 'talimat_verildi',
  };
  await yaz(list);
  return list[idx];
}

export async function vakaKapat(vakaId: string): Promise<void> {
  const list = await oku();
  const idx = list.findIndex((v) => v.id === vakaId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], durum: 'kapandi' };
  await yaz(list);
}

export async function bekleyenVakaSayisi(): Promise<number> {
  return (await oku()).filter(
    (v) => v.durum === 'yanit_bekliyor' || v.durum === 'talimat_verildi'
  ).length;
}
