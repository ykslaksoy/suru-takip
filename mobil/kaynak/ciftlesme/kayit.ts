/** Çiftleşme kayıtları — kalıcı depo (küçük JSON) */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { CiftlesmeKaydi } from './hesap';

const KEY = 'sy_ciftlesme_v1';

export async function ciftlesmeOku(): Promise<CiftlesmeKaydi[]> {
  const raw = await kaliciGetItem(KEY);
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function ciftlesmeYaz(l: CiftlesmeKaydi[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(l));
}

/** Geri dönüşüm kutusundan geri al */
export async function ciftlesmeGeriYukle(k: CiftlesmeKaydi): Promise<void> {
  const l = await ciftlesmeOku();
  const temiz = { ...k, silindi: null };
  await ciftlesmeYaz(l.some((x) => x.id === k.id) ? l.map((x) => (x.id === k.id ? temiz : x)) : [temiz, ...l]);
}
