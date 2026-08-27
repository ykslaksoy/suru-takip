/** Ana ekranda seçilebilir tüm menü öğeleri */

export type MenuOgesi = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

export const MENU_KATALOGU: MenuOgesi[] = [
  { id: 'suru', label: 'Sürü', icon: '🐑', href: '/(tabs)/suru' },
  { id: 'ekle', label: 'Hayvan ekle', icon: '➕', href: '/hayvan/ekle' },
  { id: 'tartim', label: 'Tartım', icon: '⚖️', href: '/(tabs)/suru' },
  { id: 'stok', label: 'Stok', icon: '📦', href: '/(tabs)/stok' },
  { id: 'saglik', label: 'Sağlık', icon: '💊', href: '/(tabs)/saglik' },
  { id: 'rasyon', label: 'Rasyon', icon: '🌾', href: '/(tabs)/rasyon' },
  { id: 'veteriner', label: 'Veteriner', icon: '🩺', href: '/(tabs)/veteriner' },
  { id: 'akilli-kuzu', label: 'Akıllı Kuzu', icon: '✨', href: '/(tabs)/akilli-kuzu' },
  { id: 'turkvet', label: 'TÜRKVET', icon: '📋', href: '/turkvet-aktar' },
  { id: 'abonelik', label: 'Abonelik', icon: '💳', href: '/abonelik' },
  { id: 'beta', label: 'Pilot', icon: '🧪', href: '/beta' },
  { id: 'bekletme', label: 'Bekletme', icon: '⏳', href: '/(tabs)/saglik' },
  { id: 'dusuk-stok', label: 'Düşük stok', icon: '⚠️', href: '/(tabs)/stok' },
  { id: 'takviye', label: 'Takviye', icon: '🧂', href: '/(tabs)/stok' },
  { id: 'rasyon-oneri', label: 'Rasyon önerisi', icon: '💡', href: '/(tabs)/rasyon' },
  { id: 'ayarlar', label: 'Ayarlar', icon: '⚙️', href: '/(tabs)/ayarlar' },
  { id: 'besi', label: 'Aktif mod', icon: '🛤️', href: '/(tabs)/yolculuk' },
  { id: 'hayvan-ara', label: 'Hayvan ara', icon: '🔍', href: '/(tabs)/suru' },
];

export const MENU_KATALOGU_HARITASI = Object.fromEntries(MENU_KATALOGU.map((m) => [m.id, m])) as Record<
  string,
  MenuOgesi
>;
