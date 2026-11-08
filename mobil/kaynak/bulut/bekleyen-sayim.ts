/**
 * Senkron çipi için bekleyen sayısı — hayvan satır kuyruğu ile belge kuyruğu çift sayım yapmaz.
 */
import { getPendingSyncCount as legacyKuyrukUzunlugu } from '@/kaynak/cekirdek/veritabani';
import { kaliciGetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { META_ANAHTAR, type SenkronMeta } from './motor';

async function belgeBekleyen(): Promise<number> {
  const raw = await kaliciGetItem(META_ANAHTAR);
  if (!raw) return 0;
  try {
    const m = JSON.parse(raw) as SenkronMeta;
    return m.bekleyen?.length ?? 0;
  } catch {
    return 0;
  }
}

/** Çip / özet: max(legacy hayvan kuyruğu, sy_bulut_meta bekleyen belge anahtarı) */
export async function getSenkronBekleyenSayisi(): Promise<number> {
  const [legacy, belge] = await Promise.all([legacyKuyrukUzunlugu(), belgeBekleyen()]);
  return Math.max(legacy, belge);
}
