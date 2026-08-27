import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimal, upsertAnimal } from '@/kaynak/cekirdek/veritabani';

/** Şecere: anne / baba (gehis) bağları */
export async function secereBagla(
  hayvanId: string,
  bag: { motherId?: string | null; gehisId?: string | null; turkvetNo?: string }
): Promise<Animal | null> {
  const a = await getAnimal(hayvanId);
  if (!a) return null;
  return upsertAnimal({
    ...a,
    motherId: bag.motherId !== undefined ? bag.motherId : a.motherId,
    gehisId: bag.gehisId !== undefined ? bag.gehisId : a.gehisId,
    turkvetNo: bag.turkvetNo !== undefined ? bag.turkvetNo.trim() : a.turkvetNo,
  });
}

export function secereOzeti(a: Animal): string {
  const parts: string[] = [];
  if (a.turkvetNo.trim()) parts.push(`TÜRKVET ${a.turkvetNo}`);
  if (a.motherId) parts.push('anne bağlı');
  if (a.gehisId) parts.push('baba/gehis bağlı');
  return parts.length ? parts.join(' · ') : 'Şecere eksik';
}
