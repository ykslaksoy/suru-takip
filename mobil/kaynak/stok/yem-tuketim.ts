import type { Animal, StockMovement } from '@/kaynak/cekirdek/tipler';
import {
  countAnimals,
  getAnimals,
  getStockItems,
  getStockMovements,
} from '@/kaynak/cekirdek/veritabani';
import { sonSayimOncesi } from '@/kaynak/stok/sayim';

async function padokHayvanSayisi(paddock: string): Promise<number> {
  const p = paddock.trim();
  if (!p) return Math.max(1, await countAnimals());
  return (await getAnimals()).filter((a) => a.paddock.trim() === p).length || 1;
}

function donemCikislari(
  movements: StockMovement[],
  feedStockIds: Set<string>,
  paddock?: string
): number {
  let list = movements.filter((m) => m.movementType === 'out' && feedStockIds.has(m.stockId));
  const p = paddock?.trim();
  if (p) {
    const padok = list.filter((m) => m.notes.toLowerCase().includes(p.toLowerCase()));
    if (padok.length > 0) list = padok;
  }
  return list.reduce((s, m) => s + m.quantity, 0);
}

function donemGirisleri(movements: StockMovement[], feedStockIds: Set<string>): number {
  return movements
    .filter((m) => m.movementType === 'in' && feedStockIds.has(m.stockId))
    .reduce((s, m) => s + m.quantity, 0);
}

/**
 * Dönemde hayvan başına düşen yem (kg).
 * Önce stok çıkışları, yoksa son sayım farkı + girişler.
 */
export async function hayvanBasinaYemTuketimi(
  animal: Animal,
  startAt: string,
  endAt: string
): Promise<{ kg: number; kaynak: 'stok_cikis' | 'sayim_farki' } | null> {
  const feedItems = await getStockItems('feed');
  if (feedItems.length === 0) return null;

  const feedIds = new Set(feedItems.map((f) => f.id));
  const movements = await getStockMovements({ from: startAt, to: endAt });
  const head = await padokHayvanSayisi(animal.paddock);

  const cikis = donemCikislari(movements, feedIds, animal.paddock);
  if (cikis > 0) {
    return { kg: Math.round((cikis / head) * 10) / 10, kaynak: 'stok_cikis' };
  }

  const primary = feedItems[0];
  const sayimBas = await sonSayimOncesi(primary.id, startAt);
  const sayimSon = await sonSayimOncesi(primary.id, endAt);
  if (!sayimBas || !sayimSon) return null;

  const giris = donemGirisleri(movements, feedIds);
  const tuketim = sayimBas.quantityKg + giris - sayimSon.quantityKg;
  if (tuketim <= 0) return null;

  return { kg: Math.round((tuketim / head) * 10) / 10, kaynak: 'sayim_farki' };
}

export async function sonYemSayimMiktari(stockId?: string): Promise<number | null> {
  const items = stockId ? [{ id: stockId }] : await getStockItems('feed');
  if (items.length === 0) return null;
  const sayim = await sonSayimOncesi(items[0].id, new Date().toISOString());
  return sayim?.quantityKg ?? null;
}
