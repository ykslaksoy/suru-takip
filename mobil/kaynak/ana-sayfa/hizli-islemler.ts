/** Ana sayfa — 3×3 hızlı işlemler ve alt kestirmeler */

export type HizliIslem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

export type Kestirme = {
  id: string;
  label: string;
  href: string;
};

/** Ana grid — 9 büyük kısayol (3×3) */
export const HIZLI_ISLEMLER: HizliIslem[] = [
  { id: 'suru', label: 'Sürü', icon: '🐑', href: '/(tabs)/suru' },
  { id: 'ekle', label: 'Hayvan ekle', icon: '➕', href: '/hayvan/ekle' },
  { id: 'tartim', label: 'Tartım', icon: '⚖️', href: '/(tabs)/suru' },
  { id: 'stok', label: 'Stok', icon: '📦', href: '/(tabs)/stok' },
  { id: 'saglik', label: 'Sağlık', icon: '💊', href: '/(tabs)/saglik' },
  { id: 'rasyon', label: 'Rasyon', icon: '🌾', href: '/(tabs)/rasyon' },
  { id: 'veteriner', label: 'Veteriner', icon: '🩺', href: '/(tabs)/veteriner' },
  { id: 'akilli-kuzu', label: 'Akıllı Kuzu', icon: '✨', href: '/(tabs)/akilli-kuzu' },
  { id: 'turkvet', label: 'TÜRKVET', icon: '📋', href: '/turkvet-aktar' },
];

/** Alt satır — küçük kestirmeler */
export const KESTIRMELER: Kestirme[] = [
  { id: 'abonelik', label: 'Abonelik', href: '/abonelik' },
  { id: 'beta', label: 'Pilot', href: '/beta' },
  { id: 'bekletme', label: 'Bekletme', href: '/(tabs)/saglik' },
  { id: 'dusuk-stok', label: 'Düşük stok', href: '/(tabs)/stok' },
  { id: 'rasyon-oneri', label: 'Rasyon önerisi', href: '/(tabs)/rasyon' },
  { id: 'hayvan-ara', label: 'Hayvan ara', href: '/(tabs)/suru' },
];
