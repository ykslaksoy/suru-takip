/** İlaç / aşı adını stok kalemiyle eşleştir — saf mantık */
import type { StockItem } from '@/kaynak/cekirdek/tipler';

function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Yem dışı stok kalemlerinde, adı ilaç adıyla örtüşen ilk kalem (en uzun ortak kelime öncelikli) */
export function stokKalemiEslestir(ilacAdi: string, items: StockItem[]): StockItem | null {
  const q = norm(ilacAdi);
  if (q.length < 3) return null;
  const kelimeler = q.split(' ').filter((k) => k.length >= 4);
  let enIyi: { item: StockItem; puan: number } | null = null;
  for (const it of items) {
    if (it.type === 'feed') continue;
    const ad = norm(it.name);
    let puan = 0;
    if (ad === q) puan = 100;
    else if (ad.includes(q) || q.includes(ad)) puan = 50;
    else puan = kelimeler.filter((k) => ad.includes(k)).reduce((s, k) => s + k.length, 0);
    if (puan > 0 && (!enIyi || puan > enIyi.puan)) enIyi = { item: it, puan };
  }
  return enIyi?.item ?? null;
}

/** Düşük stok: miktar ≤ minimum */
export function dusukStokMu(it: StockItem): boolean {
  return it.quantity <= it.minQuantity;
}

/** Toplu düşüm miktarı: doz × hayvan, stoktan fazla olamaz */
export function dusumMiktari(dozHayvan: number, hayvanSayisi: number, mevcut: number): { dus: number; eksik: number } {
  const gereken = Math.max(0, dozHayvan * hayvanSayisi);
  const dus = Math.min(gereken, Math.max(0, mevcut));
  return { dus, eksik: gereken - dus };
}
