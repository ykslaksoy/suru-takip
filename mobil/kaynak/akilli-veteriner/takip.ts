import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { HastalikTeshis } from './teshis';
import type { VetCevaplar } from './netlestirme';
import type { VakaFotografi } from './fotograf';

const KEY = 'sy_hastalik_takip_v1';

export type TakipAsama =
  | 'teshis'
  | 'vet_bekliyor'
  | 'tedavi'
  | 'kontrol_bekliyor'
  | 'takip'
  | 'taburcu';

export type TakipGuncelleme = {
  tarih: string;
  not: string;
  durum: 'iyilesiyor' | 'ayni' | 'kotulesti';
  fotoSayisi: number;
};

export type HastalikTakip = {
  id: string;
  animalId: string | null;
  earTag: string;
  paddock: string;
  teshis: HastalikTeshis;
  baglamMetni: string;
  cevaplar: VetCevaplar;
  baslangic: string;
  etkiBitis: string;
  sonrakiKontrol: string;
  asama: TakipAsama;
  vetDanisildi: boolean;
  tedaviUygulandi: boolean;
  karantinaYapildi: boolean;
  karantinaPadok: string | null;
  suruTedaviYapildi: boolean;
  suruTedaviHedef: 'ayni_padok' | 'tum_kuzular' | null;
  guncellemeler: TakipGuncelleme[];
  fotograflar: VakaFotografi[];
};

async function oku(): Promise<HastalikTakip[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HastalikTakip[];
  } catch {
    return [];
  }
}

async function yaz(list: HastalikTakip[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getAktifTakipler(): Promise<HastalikTakip[]> {
  return (await oku())
    .filter((t) => t.asama !== 'taburcu')
    .sort((a, b) => a.sonrakiKontrol.localeCompare(b.sonrakiKontrol));
}

export async function getTakip(id: string): Promise<HastalikTakip | null> {
  return (await oku()).find((t) => t.id === id) ?? null;
}

export async function baslatTakip(input: {
  animalId: string | null;
  earTag: string;
  paddock: string;
  teshis: HastalikTeshis;
  baglamMetni: string;
  cevaplar: VetCevaplar;
  fotograflar: VakaFotografi[];
}): Promise<HastalikTakip> {
  const baslangic = new Date();
  const etkiBitis = new Date(baslangic.getTime() + input.teshis.etkiSuresiGun * 86400000);
  const kayit: HastalikTakip = {
    id: uuidv4(),
    animalId: input.animalId,
    earTag: input.earTag,
    paddock: input.paddock,
    teshis: input.teshis,
    baglamMetni: input.baglamMetni,
    cevaplar: input.cevaplar,
    baslangic: baslangic.toISOString(),
    etkiBitis: etkiBitis.toISOString(),
    sonrakiKontrol: etkiBitis.toISOString(),
    asama: input.teshis.vetDanisma === 'zorunlu' ? 'vet_bekliyor' : 'teshis',
    vetDanisildi: false,
    tedaviUygulandi: false,
    karantinaYapildi: false,
    karantinaPadok: null,
    suruTedaviYapildi: false,
    suruTedaviHedef: null,
    guncellemeler: [],
    fotograflar: input.fotograflar,
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function takipGuncelle(
  id: string,
  patch: Partial<HastalikTakip>
): Promise<HastalikTakip | null> {
  const list = await oku();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await yaz(list);
  return list[idx];
}

export async function vetDanisildiIsaretle(id: string): Promise<void> {
  await takipGuncelle(id, { vetDanisildi: true, asama: 'teshis' });
}

export async function tedaviUygulandiIsaretle(id: string): Promise<void> {
  const t = await getTakip(id);
  if (!t) return;
  await takipGuncelle(id, {
    tedaviUygulandi: true,
    asama: 'kontrol_bekliyor',
    sonrakiKontrol: t.etkiBitis,
  });
}

export async function karantinaYapildiIsaretle(id: string, padokAd: string): Promise<void> {
  await takipGuncelle(id, {
    karantinaYapildi: true,
    karantinaPadok: padokAd,
    asama: 'takip',
  });
}

export async function suruTedaviIsaretle(
  id: string,
  hedef: 'ayni_padok' | 'tum_kuzular'
): Promise<void> {
  await takipGuncelle(id, { suruTedaviYapildi: true, suruTedaviHedef: hedef });
}

export async function kontrolGuncelle(
  id: string,
  guncelleme: Omit<TakipGuncelleme, 'tarih'> & { tarih?: string }
): Promise<void> {
  const t = await getTakip(id);
  if (!t) return;
  const kayit: TakipGuncelleme = {
    ...guncelleme,
    tarih: guncelleme.tarih ?? new Date().toISOString(),
  };
  const guncellemeler = [...t.guncellemeler, kayit];
  let asama: TakipAsama = 'takip';
  if (kayit.durum === 'iyilesiyor' && guncellemeler.length >= 2) {
    asama = 'taburcu';
  } else if (kayit.durum === 'kotulesti') {
    asama = 'vet_bekliyor';
  }
  await takipGuncelle(id, { guncellemeler, asama });
}

export function kontrolZamaniGeldi(t: HastalikTakip): boolean {
  return Date.now() >= new Date(t.sonrakiKontrol).getTime();
}

export function asamaEtiket(a: TakipAsama): string {
  const map: Record<TakipAsama, string> = {
    teshis: 'Teşhis — tedavi bekliyor',
    vet_bekliyor: 'Veteriner danışması bekleniyor',
    tedavi: 'Tedavi uygulanacak',
    kontrol_bekliyor: 'Etki süresi — kontrol bekleniyor',
    takip: 'Takip modunda',
    taburcu: 'Taburcu',
  };
  return map[a];
}

export async function taburcuEt(id: string): Promise<void> {
  await takipGuncelle(id, { asama: 'taburcu' });
}
