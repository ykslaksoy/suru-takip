import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { sutOrtLBas, sutToplamLitre, yapagiOrtKg } from './hesap';
import type { VerimKayit, VerimSutKayit, VerimYapagiKayit } from './tipler';

export const VERIM_ANAHTAR = 'sy_verim_kayitlari_v1';

async function oku(): Promise<VerimKayit[]> {
  const raw = await kaliciGetItem(VERIM_ANAHTAR);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as VerimKayit[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: VerimKayit[]): Promise<void> {
  await kaliciSetItem(VERIM_ANAHTAR, JSON.stringify(list));
}

export async function listVerimKayitlari(): Promise<VerimKayit[]> {
  const list = await oku();
  return [...list].sort((a, b) => b.tarih.localeCompare(a.tarih) || b.createdAt.localeCompare(a.createdAt));
}

export async function listSutKayitlari(): Promise<VerimSutKayit[]> {
  const list = await oku();
  return list.filter((k): k is VerimSutKayit => k.tur === 'sut');
}

export async function listYapagiKayitlari(): Promise<VerimYapagiKayit[]> {
  const list = await oku();
  return list.filter((k): k is VerimYapagiKayit => k.tur === 'yapagi');
}

export async function sutKaydiEkle(input: {
  tarih: string;
  sabahLitre?: number | null;
  aksamLitre?: number | null;
  toplamLitre?: number;
  girisModu: 'tank' | 'bas';
  hayvanSayisi: number;
  kaliteNot?: string;
}): Promise<VerimSutKayit> {
  const toplam = sutToplamLitre(input.sabahLitre ?? null, input.aksamLitre ?? null, input.toplamLitre);
  const bas = Math.max(1, Math.floor(input.hayvanSayisi || 1));
  const kayit: VerimSutKayit = {
    id: uuidv4(),
    tur: 'sut',
    tarih: input.tarih.slice(0, 10),
    sabahLitre: input.sabahLitre ?? null,
    aksamLitre: input.aksamLitre ?? null,
    toplamLitre: toplam,
    girisModu: input.girisModu,
    hayvanSayisi: bas,
    kaliteNot: (input.kaliteNot ?? '').trim(),
    ortLBas: sutOrtLBas(toplam, bas),
    createdAt: new Date().toISOString(),
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function yapagiKaydiEkle(input: {
  tarih: string;
  basSayisi: number;
  toplamKg: number;
  satisNot?: string;
}): Promise<VerimYapagiKayit> {
  const bas = Math.max(1, Math.floor(input.basSayisi || 1));
  const kg = Math.max(0, input.toplamKg);
  const kayit: VerimYapagiKayit = {
    id: uuidv4(),
    tur: 'yapagi',
    tarih: input.tarih.slice(0, 10),
    basSayisi: bas,
    toplamKg: kg,
    ortKgBas: yapagiOrtKg(kg, bas),
    satisNot: (input.satisNot ?? '').trim(),
    createdAt: new Date().toISOString(),
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

/** Mod 4 sağım listesine uyumlu dışa aktarım */
export function verimSutToSagimInput(k: VerimSutKayit): {
  litre: number;
  hayvanSayisi: number;
  tarih: string;
  notes: string;
} {
  return {
    litre: k.toplamLitre,
    hayvanSayisi: k.hayvanSayisi,
    tarih: k.tarih,
    notes: `Verim ekranı · ${k.girisModu === 'tank' ? 'tank' : 'baş'}${k.kaliteNot ? ` · ${k.kaliteNot}` : ''}`,
  };
}
