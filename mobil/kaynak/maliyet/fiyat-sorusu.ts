/** "Bilmiyorum / Geç" denilen kalemler — tekrar sorulmaz, tahmini fiyat kullanılmaya devam eder. */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';

const KEY = 'sy_fiyat_sorusu_gecilen_v1';

export async function getGecilenFiyatSorulari(): Promise<Record<string, string>> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function fiyatSorusunuGec(anahtar: string): Promise<void> {
  const g = await getGecilenFiyatSorulari();
  g[anahtar] = new Date().toISOString();
  await kaliciSetItem(KEY, JSON.stringify(g));
}
