import { Platform, useWindowDimensions } from 'react-native';

/**
 * Dock + scroll boşlukları.
 *
 * Önemli (mobil web FOUC):
 * - useSafeAreaInsets() ilk frame’de 0 → sonra dolar; üst/alt pad kaydırır.
 * - Üst safe-area yalnızca CSS `#root` padding-top (env) — burada ekleme.
 * - Tarayıcı chrome `--app-height` / 100svh ile dışarıda; dock’a ekstra
 *   “tarayıcı payı” eklemek Safari üstünde beyaz boşluk yaratır.
 * - Expo Tabs içeriği dock’un üstünde; scrollPad yalnızca son satır nefes payı.
 */
export function useAltGuvenliBosluk(tabBarYukseklik = 72) {
  const { height, width } = useWindowDimensions();
  const yatay = width > height;
  // height henüz 0 iken kisa=true olmasın → maskot/pad zıplamasın
  const olculu = height >= 100;
  const kisa = olculu && (height < 480 || yatay);
  const darTelefon = width > 0 && width < 520;

  // Dock alt: yalnızca ince nefes — home indicator CSS #root’ta
  const tabBarPad = Platform.OS === 'web' ? (kisa ? 6 : 10) : kisa ? 8 : 12;

  // Tabs zaten dock yüksekliğini ayırır; yine de mobil web’de son sıra
  // etiketleri dock’a yapışmasın diye orta pay (eski 144+ tarayıcı payı yok)
  const scrollPad =
    Platform.OS === 'web'
      ? (darTelefon ? 56 : 32) + (kisa ? 8 : 0)
      : tabBarYukseklik + (kisa ? 12 : 20);

  // Üst: sabit küçük pad — CSS safe-area ile çiftlenmesin, inset beklemesin
  const headerPadTop = kisa ? 6 : darTelefon ? 10 : 12;

  return {
    yatay,
    kisa,
    darTelefon,
    insetTop: 0,
    insetBottom: 0,
    tabBarPadBottom: Math.round(tabBarPad),
    scrollPadBottom: Math.round(scrollPad),
    headerPadTop: Math.round(headerPadTop),
    tarayiciPayi: 0,
  };
}
