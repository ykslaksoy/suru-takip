/** Ekonomi çıktısı — eksik maliyet 0 sayılmaz. */

export type EkonomiTamamlik = 'tam' | 'kismi' | 'eksik';

export function ekonomiTamamlikBelirle(eksikler: string[], yemVeBakim: number | null, maliyetDokumuEksik: boolean): EkonomiTamamlik {
  if (eksikler.length > 0 && yemVeBakim == null) return 'eksik';
  if (eksikler.length > 0 || yemVeBakim == null || maliyetDokumuEksik) return 'kismi';
  return 'tam';
}

/** Net kâr iddiası yok — model dengesi */
export function dengeBaslik(t: EkonomiTamamlik): string {
  if (t === 'tam') return 'Model dengesi (tam girdi)';
  if (t === 'kismi') return 'Model dengesi (eksik maliyet — net kâr değil)';
  return 'Hesaplanamadı';
}

export const EKONOMI_UYARI_GENETIK =
  'Genetik tavan, rekor veya garanti maksimum kâr iddiası yok — yalnızca girilen varsayımlar.';

export const EKONOMI_UYARI_KARKAS =
  'Karkas fiyatı kemiksiz et değildir; canlı fiyat otomatik kopyalanmaz.';
