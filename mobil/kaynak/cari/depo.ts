import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { CariHesap, CariIslem, CariIslemTur, CariTur } from './tipler';

export const CARI_ANAHTAR = 'sy_cari_hesaplar_v1';

type CariBelge = {
  hesaplar: CariHesap[];
  islemler: CariIslem[];
};

const GECERLI_TUR = new Set<CariTur>(['yemci', 'tuccar', 'alici', 'veteriner', 'diger']);
const GECERLI_ISLEM = new Set<CariIslemTur>(['borc', 'alis', 'odeme', 'tahsilat', 'vade']);

async function oku(): Promise<CariBelge> {
  const raw = await kaliciGetItem(CARI_ANAHTAR);
  if (!raw) return { hesaplar: [], islemler: [] };
  try {
    const p = JSON.parse(raw) as Partial<CariBelge>;
    return {
      hesaplar: Array.isArray(p.hesaplar) ? p.hesaplar : [],
      islemler: Array.isArray(p.islemler) ? p.islemler : [],
    };
  } catch {
    return { hesaplar: [], islemler: [] };
  }
}

async function yaz(belge: CariBelge): Promise<void> {
  await kaliciSetItem(CARI_ANAHTAR, JSON.stringify(belge));
}

export async function listCariHesaplar(): Promise<CariHesap[]> {
  const { hesaplar } = await oku();
  return [...hesaplar].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

export async function getCariHesap(id: string): Promise<CariHesap | null> {
  const { hesaplar } = await oku();
  return hesaplar.find((h) => h.id === id) ?? null;
}

export async function cariHesapEkle(input: {
  ad: string;
  tur: CariTur;
  telefon?: string;
  not?: string;
}): Promise<CariHesap> {
  const tur = GECERLI_TUR.has(input.tur) ? input.tur : 'diger';
  const kayit: CariHesap = {
    id: uuidv4(),
    ad: input.ad.trim(),
    tur,
    telefon: (input.telefon ?? '').trim(),
    not: (input.not ?? '').trim(),
    createdAt: new Date().toISOString(),
  };
  const belge = await oku();
  belge.hesaplar.unshift(kayit);
  await yaz(belge);
  return kayit;
}

export async function cariIslemEkle(input: {
  cariId: string;
  tur: CariIslemTur;
  tutar: number;
  tarih: string;
  not?: string;
  vadeTarihi?: string;
}): Promise<CariIslem | null> {
  if (!GECERLI_ISLEM.has(input.tur)) return null;
  const belge = await oku();
  if (!belge.hesaplar.some((h) => h.id === input.cariId)) return null;
  const tutar = input.tur === 'vade' ? Math.abs(input.tutar) : Math.abs(input.tutar);
  if (input.tur !== 'vade' && (!Number.isFinite(tutar) || tutar <= 0)) return null;
  const kayit: CariIslem = {
    id: uuidv4(),
    cariId: input.cariId,
    tur: input.tur,
    tutar,
    tarih: input.tarih.slice(0, 10),
    not: (input.not ?? '').trim(),
    vadeTarihi: input.vadeTarihi?.slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  belge.islemler.unshift(kayit);
  await yaz(belge);
  return kayit;
}

export async function listCariIslemler(cariId?: string): Promise<CariIslem[]> {
  const { islemler } = await oku();
  const list = cariId ? islemler.filter((i) => i.cariId === cariId) : islemler;
  return [...list].sort((a, b) => b.tarih.localeCompare(a.tarih) || b.createdAt.localeCompare(a.createdAt));
}
