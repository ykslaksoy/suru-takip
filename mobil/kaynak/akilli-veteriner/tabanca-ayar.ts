/**
 * Otomatik aşı tabancası — cihaz ayarı (kalıcı) + stok tespiti + iğne ucu düşümü.
 * Saf hesap: asi-tabancasi.ts
 */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { adjustStock, getLatestWeight, getStockItems } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import {
  TABANCA_KAPASITELERI,
  VARSAYILAN_TABANCA_KAPASITE,
  igneUcuAdedi,
  igneUcuStokMu,
  tabancaAyariHesapla,
  tabancaStokMu,
  type TabancaAyari,
  type TabancaKuzu,
  type TabancaUygunDegil,
} from './asi-tabancasi';

const KEY = 'sy_asi_tabancasi_v1';

export type TabancaTercih = {
  /** null → stokta tabanca varsa açık */
  kullan: boolean | null;
  kapasite: number;
};

export type TabancaDurum = TabancaTercih & { stoktaVar: boolean; aktif: boolean };

export async function getTabancaTercih(): Promise<TabancaTercih> {
  const raw = await kaliciGetItem(KEY);
  const varsay: TabancaTercih = { kullan: null, kapasite: VARSAYILAN_TABANCA_KAPASITE };
  if (!raw) return varsay;
  try {
    const t = JSON.parse(raw) as Partial<TabancaTercih>;
    const kap = (TABANCA_KAPASITELERI as readonly number[]).includes(Number(t.kapasite)) ? Number(t.kapasite) : varsay.kapasite;
    return { kullan: typeof t.kullan === 'boolean' ? t.kullan : null, kapasite: kap };
  } catch {
    return varsay;
  }
}

export async function setTabancaTercih(t: Partial<TabancaTercih>): Promise<TabancaTercih> {
  const next = { ...(await getTabancaTercih()), ...t };
  await kaliciSetItem(KEY, JSON.stringify(next));
  return next;
}

export async function getTabancaDurum(): Promise<TabancaDurum> {
  const [t, stok] = await Promise.all([getTabancaTercih(), getStockItems()]);
  const stoktaVar = stok.some((s) => tabancaStokMu(s.name) && s.quantity > 0);
  return { ...t, stoktaVar, aktif: t.kullan ?? stoktaVar };
}

/** Seçili kuzuların son tartımı → tabanca ayarı */
export async function tabancaAyariGetir(
  programId: string,
  hayvanlar: Animal[],
  kapasite: number,
): Promise<TabancaAyari | TabancaUygunDegil> {
  const kuzular: TabancaKuzu[] = await Promise.all(
    hayvanlar.map(async (a) => ({ id: a.id, etiket: a.earTag || hayvanAnaEtiket(a), kg: await getLatestWeight(a.id) })),
  );
  return tabancaAyariHesapla(programId, kuzular, kapasite);
}

/** Toplu kayıtta iğne ucu stoktan düş (her 20 kuzuda bir, en az 1) */
export async function igneUcuDus(kuzuSayisi: number, not: string): Promise<{ dusulen: number; stokYok: boolean }> {
  const adet = igneUcuAdedi(kuzuSayisi);
  if (adet === 0) return { dusulen: 0, stokYok: false };
  const item = (await getStockItems()).find((s) => igneUcuStokMu(s.name));
  if (!item) return { dusulen: 0, stokYok: true };
  const dusulen = Math.min(item.quantity, adet);
  if (dusulen > 0) await adjustStock(item.id, 'out', dusulen, `İğne ucu · ${not}`);
  return { dusulen, stokYok: dusulen < adet };
}
