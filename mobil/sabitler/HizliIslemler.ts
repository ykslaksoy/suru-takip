/** Kilitli ana sayfa — Hızlı İşlemler + 5’li dock (Grok 2026-09-07). */

export type KilitliHizliIslemId =
  | 'kuzu-ekle'
  | 'asi'
  | 'hizli-tartim'
  | 'rasyon'
  | 'veteriner'
  | 'stok'
  | 'fcr-gca'
  | 'gorevler';

export type KilitliHizliIslem = {
  id: KilitliHizliIslemId;
  label: string;
  href: string;
  icon: KilitliHizliIslemId;
};

export const KILITLI_HIZLI_ISLEMLER: KilitliHizliIslem[] = [
  { id: 'kuzu-ekle', label: 'Kuzu Ekle', href: '/hayvan/hizli-ekle', icon: 'kuzu-ekle' },
  { id: 'asi', label: 'Aşı', href: '/(tabs)/saglik', icon: 'asi' },
  { id: 'hizli-tartim', label: 'Hızlı Tartım', href: '/seri-giris', icon: 'hizli-tartim' },
  { id: 'rasyon', label: 'Rasyon', href: '/(tabs)/rasyon', icon: 'rasyon' },
  { id: 'veteriner', label: 'Veteriner', href: '/(tabs)/veteriner', icon: 'veteriner' },
  { id: 'stok', label: 'Stok', href: '/(tabs)/stok', icon: 'stok' },
  { id: 'fcr-gca', label: 'FCR GCA', href: '/(tabs)/yolculuk', icon: 'fcr-gca' },
  { id: 'gorevler', label: 'Görevler', href: '/gorevler', icon: 'gorevler' },
];

export const KILITLI_DOCK: { name: string; title: string }[] = [
  { name: 'index', title: 'Ana Sayfa' },
  { name: 'suru', title: 'Sürü' },
  { name: 'stok', title: 'Stok' },
  { name: 'akilli-kuzu', title: 'Akıllı Kuzu' },
  { name: 'daha', title: 'Daha' },
];

export const KILITLI_DOCK_ADLARI = KILITLI_DOCK.map((d) => d.name);

export type DahaMenuOgesi = {
  id: string;
  label: string;
  href?: string;
  ayarlar?: boolean;
};

/** Dock’tan çıkan sekmeler + sık kullanılan ekstra yollar */
export const DAHA_MENUSU: DahaMenuOgesi[] = [
  { id: 'saglik', label: 'Sağlık', href: '/(tabs)/saglik' },
  { id: 'rasyon', label: 'Rasyon', href: '/(tabs)/rasyon' },
  { id: 'veteriner', label: 'Veteriner', href: '/(tabs)/veteriner' },
  { id: 'yolculuk', label: 'Yolculuk', href: '/(tabs)/yolculuk' },
  { id: 'profesyonellik', label: 'Profesyonellik', href: '/profesyonellik' },
  { id: 'ayarlar', label: 'Ayarlar', ayarlar: true },
  { id: 'gorevler', label: 'Görevler', href: '/gorevler' },
  { id: 'seri', label: 'Seri ahır', href: '/seri-giris' },
  { id: 'ses', label: 'Sesli komut', href: '/ses' },
];
