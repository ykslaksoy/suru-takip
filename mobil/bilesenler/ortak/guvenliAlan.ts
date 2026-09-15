import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Safari / tarayıcı alt çubuğu + sekme dock için dinamik alt boşluk.
 * PWA dışı mobil web'de env(safe-area-inset) çoğu zaman yetersiz kalır.
 *
 * Not: Expo Tabs içeriği dock üstünde tutar; yine de mobil web’de dock
 * veya tarayıcı chrome içerik üstüne binebildiği için ekstra pay şart.
 */
export function useAltGuvenliBosluk(tabBarYukseklik = 72) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const yatay = width > height;
  const kisa = height < 480 || yatay;
  const darTelefon = width > 0 && width < 520;

  // Mobil web: tarayıcı toolbar + home indicator; dikeyde daha fazla pay
  const tarayiciPayi =
    Platform.OS === 'web'
      ? kisa
        ? Math.max(36, Math.round(height * 0.08))
        : darTelefon
          ? Math.max(72, Math.round(height * 0.12))
          : Math.max(48, Math.round(height * 0.08))
      : 0;

  const insetBottom = Math.max(insets.bottom, 0);
  const insetTop = Math.max(insets.top, 0);

  // Dock: ikon + etiket + pad (~64–88) — varsayılan 72
  const tabBarPad =
    Platform.OS === 'web'
      ? (kisa ? 12 : 18) + Math.round(tarayiciPayi * 0.2) + Math.max(insetBottom, darTelefon ? 8 : 0)
      : (kisa ? 8 : 12) + insetBottom;

  const scrollPad =
    tabBarYukseklik +
    tarayiciPayi +
    (kisa ? 20 : darTelefon ? 40 : 28) +
    insetBottom +
    (Platform.OS === 'web' && darTelefon ? 24 : 0);

  return {
    yatay,
    kisa,
    darTelefon,
    insetTop,
    insetBottom,
    tabBarPadBottom: Math.round(tabBarPad),
    scrollPadBottom: Math.round(scrollPad),
    headerPadTop: Math.round(
      Math.max(insetTop, Platform.OS === 'web' && darTelefon ? 16 : 0) + (kisa ? 8 : 14),
    ),
    tarayiciPayi: Math.round(tarayiciPayi),
  };
}
