import { Ionicons } from '@expo/vector-icons';

/** Tutarlı vektör ikonlar — emoji karışıklığını bitirir */
export type SekmeIkonAdi = keyof typeof Ionicons.glyphMap;

export const SEKME_IKONLARI: Record<string, SekmeIkonAdi> = {
  index: 'home-outline',
  suru: 'paw-outline',
  stok: 'cube-outline',
  saglik: 'medkit-outline',
  rasyon: 'leaf-outline',
  veteriner: 'fitness-outline',
  'akilli-kuzu': 'person-outline',
  yolculuk: 'map-outline',
  ayarlar: 'settings-outline',
  daha: 'ellipsis-horizontal',
};

export const SEKME_IKONLARI_DOLU: Record<string, SekmeIkonAdi> = {
  index: 'home',
  suru: 'paw',
  stok: 'cube',
  saglik: 'medkit',
  rasyon: 'leaf',
  veteriner: 'fitness',
  'akilli-kuzu': 'person',
  yolculuk: 'map',
  ayarlar: 'settings',
  daha: 'ellipsis-horizontal',
};
