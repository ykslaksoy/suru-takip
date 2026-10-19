/** Yem/rasyon ham kayıtları (geri dönüşüm kutusu da buradan geri yükler) */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { DusumKalemi, PartiRasyonu, YemAlimi } from './hesap';

export const KEY_RASYON = 'sy_parti_rasyon_v1';
export const KEY_ALIM = 'sy_yem_alim_v1';
export const KEY_DUSUM = 'sy_yem_dusum_log_v1';

export type DusumKaydi = { id: string; zaman: string; gun: string; kalemler: (DusumKalemi & { dusulen: number; eksik: number })[] };

async function oku<T>(k: string): Promise<T[]> {
  const raw = await kaliciGetItem(k);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

async function yaz<T>(k: string, v: T[]): Promise<void> {
  await kaliciSetItem(k, JSON.stringify(v));
}

export const rasyonlariOku = () => oku<PartiRasyonu>(KEY_RASYON);
export const rasyonlariYaz = (v: PartiRasyonu[]) => yaz(KEY_RASYON, v);
export const alimlariOku = () => oku<YemAlimi>(KEY_ALIM);
export const alimlariYaz = (v: YemAlimi[]) => yaz(KEY_ALIM, v.slice(0, 1000));
export const dusumleriOku = () => oku<DusumKaydi>(KEY_DUSUM);
export const dusumleriYaz = (v: DusumKaydi[]) => yaz(KEY_DUSUM, v.slice(0, 300));

/** Silinen rasyonu geri koy (aynı parti için aktif başka rasyon varsa pasif döner) */
export async function rasyonGeriYukle(r: PartiRasyonu): Promise<void> {
  const l = await rasyonlariOku();
  const cakisma = l.some((x) => x.parti === r.parti && x.aktif && x.id !== r.id);
  await rasyonlariYaz([{ ...r, aktif: r.aktif && !cakisma }, ...l.filter((x) => x.id !== r.id)]);
}
