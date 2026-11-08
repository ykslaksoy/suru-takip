/** Satış geliri — kullanıcı varsayımı; piyasa/borsa değil. */

export type SatisFiyatBirimi = 'canli_kg' | 'karkas_kg';

export const SATIS_KAYNAK_VARSAYIM = 'Kullanıcı planlama varsayımı';

export function karkasVerimOku(yuzdeMetin: string): number | null {
  const t = yuzdeMetin.trim();
  if (!t) return null;
  const n = parseFloat(t.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const oran = n > 1 ? n / 100 : n;
  if (oran <= 0 || oran > 1) return null;
  return oran;
}

export function satisGelirBasHesapla(opts: {
  canliKg: number;
  birim: SatisFiyatBirimi;
  fiyatKg: number;
  karkasVerim: number | null;
}): { gelirBas: number | null; satisKg: number | null; eksikler: string[] } {
  const eksikler: string[] = [];
  if (!Number.isFinite(opts.canliKg) || opts.canliKg <= 0) eksikler.push('Canlı kg');
  if (!Number.isFinite(opts.fiyatKg) || opts.fiyatKg <= 0) eksikler.push('Satış fiyatı');
  if (opts.birim === 'karkas_kg') {
    if (opts.karkasVerim == null) eksikler.push('Karkas verimi (%) — kemiksiz et değil, karkas/canlı');
    const satisKg = opts.karkasVerim != null ? opts.canliKg * opts.karkasVerim : null;
    if (eksikler.length) return { gelirBas: null, satisKg, eksikler };
    return { gelirBas: (satisKg ?? 0) * opts.fiyatKg, satisKg, eksikler: [] };
  }
  if (eksikler.length) return { gelirBas: null, satisKg: null, eksikler };
  return { gelirBas: opts.canliKg * opts.fiyatKg, satisKg: opts.canliKg, eksikler: [] };
}
