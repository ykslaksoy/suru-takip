import { Platform, useWindowDimensions } from 'react-native';

/**
 * Safari / tarayıcı alt çubuğu + sekme dock için dinamik alt boşluk.
 * PWA dışı mobil web'de env(safe-area-inset) çoğu zaman yetersiz kalır.
 */
export function useAltGuvenliBosluk(tabBarYukseklik = 56) {
  const { height, width } = useWindowDimensions();
  const yatay = width > height;
  const kisa = height < 480 || yatay;

  // Mobil web: tarayıcı toolbar ~44–90px; dikeyde daha fazla pay bırak
  const tarayiciPayi =
    Platform.OS === 'web'
      ? kisa
        ? Math.max(28, Math.round(height * 0.06))
        : Math.max(56, Math.round(height * 0.1))
      : 0;

  const safeInset =
    Platform.OS === 'web'
      ? // CSS env ile de desteklenir; JS tarafında minimum garanti
        0
      : 0;

  const tabBarPad = Platform.OS === 'web' ? (kisa ? 10 : 16) + tarayiciPayi * 0.25 : kisa ? 8 : 12;
  const scrollPad = tabBarYukseklik + tarayiciPayi + (kisa ? 12 : 24) + safeInset;

  return {
    yatay,
    kisa,
    tabBarPadBottom: Math.round(tabBarPad),
    scrollPadBottom: Math.round(scrollPad),
    tarayiciPayi: Math.round(tarayiciPayi),
  };
}
