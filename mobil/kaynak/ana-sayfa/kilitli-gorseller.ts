import type { ImageSourcePropType } from 'react-native';
import type { KilitliHizliIslemId } from '@/sabitler/HizliIslemler';

export const KILITLI_MASKOT: ImageSourcePropType = require('../../assets/home-locked/mascot-lamb.png');

export const KILITLI_HIZLI_IKONLAR: Record<KilitliHizliIslemId, ImageSourcePropType> = {
  'kuzu-ekle': require('../../assets/home-locked/icon-kuzu-ekle.png'),
  asi: require('../../assets/home-locked/icon-asi.png'),
  'hizli-tartim': require('../../assets/home-locked/icon-hizli-tartim.png'),
  rasyon: require('../../assets/home-locked/icon-rasyon.png'),
  veteriner: require('../../assets/home-locked/icon-veteriner.png'),
  stok: require('../../assets/home-locked/icon-stok.png'),
  'fcr-gca': require('../../assets/home-locked/icon-fcr-gca.png'),
  gorevler: require('../../assets/home-locked/icon-gorevler.png'),
};
