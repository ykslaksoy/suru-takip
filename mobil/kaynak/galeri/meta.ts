/** Fotoğraf üst verisi (küçük JSON) — görüntüler ayrı tutulur (web: IndexedDB, native: dosya) */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { FotoKaydi } from './hesap';

const KEY = 'sy_foto_meta_v1';

export async function metaOku(): Promise<FotoKaydi[]> {
  const raw = await kaliciGetItem(KEY);
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function metaYaz(l: FotoKaydi[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(l));
}

/** Geri dönüşüm kutusundan geri al */
export async function fotoGeriYukle(f: FotoKaydi): Promise<void> {
  const l = await metaOku();
  const var_ = l.some((x) => x.id === f.id);
  await metaYaz(var_ ? l.map((x) => (x.id === f.id ? { ...x, silindi: undefined } : x)) : [{ ...f, silindi: undefined }, ...l]);
}
