/**
 * Kullanıcının bilerek sildiği örnek (demo) kuzular — demo tamamlama bunları yeniden eklemesin.
 * Geri dönüşüm kutusundan geri alınınca listeden çıkar.
 */
import { kaliciGetItem, kaliciSetItem } from './web-kalici-depo';

const KEY = 'sy_demo_silinen_v1';

export async function getSilinenDemoIdleri(): Promise<Set<string>> {
  const raw = await kaliciGetItem(KEY);
  try {
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function silinenDemoIsaretle(id: string, silindi: boolean): Promise<void> {
  const s = await getSilinenDemoIdleri();
  if (silindi === s.has(id)) return;
  if (silindi) s.add(id);
  else s.delete(id);
  await kaliciSetItem(KEY, JSON.stringify([...s].slice(-2000)));
}
