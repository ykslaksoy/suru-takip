import { getAllHealthRecordsForAsi, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { hayvanArinmalari, type ArinmaAyar, type HayvanArinma } from './hesap';

const KEY = 'sy_arinma_ayar_v1';

export async function getArinmaAyar(): Promise<ArinmaAyar> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? (o as ArinmaAyar) : {};
  } catch {
    return {};
  }
}

/** gun = null → varsayılana (tahmini) dön */
export async function setArinmaGunu(ilacId: string, gun: number | null): Promise<ArinmaAyar> {
  const a = await getArinmaAyar();
  if (gun == null || !Number.isFinite(gun) || gun < 0) delete a[ilacId];
  else a[ilacId] = Math.round(gun);
  await kaliciSetItem(KEY, JSON.stringify(a));
  return a;
}

export function yerelGun(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

/** Aktif (satılmamış / ölmemiş) kuzuların süren arınmaları */
export async function getAktifArinmalar(tarih = yerelGun()): Promise<HayvanArinma[]> {
  const [kayitlar, hayvanlar, ayar] = await Promise.all([getAllHealthRecordsForAsi(), getAnimals(), getArinmaAyar()]);
  const aktif = new Set(hayvanlar.filter((a) => a.status !== 'sold' && a.status !== 'dead').map((a) => a.id));
  return hayvanArinmalari(kayitlar, tarih, ayar, aktif);
}

/** Tüm hayvanlar (satılan dahil) — satış ekranı tarih kontrolü için */
export async function getArinmalarTarihte(tarih: string): Promise<HayvanArinma[]> {
  const [kayitlar, ayar] = await Promise.all([getAllHealthRecordsForAsi(), getArinmaAyar()]);
  return hayvanArinmalari(kayitlar, tarih, ayar);
}
