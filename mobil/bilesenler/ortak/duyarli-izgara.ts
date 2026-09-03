import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions } from 'react-native';

/** Kapsayıcı ölçümü — pencere yerine gerçek alan (yatay/çerçeve dostu) */
export function useKapsayiciOlcu(horizontalPadding = 14) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [measuredW, setMeasuredW] = useState<number | null>(null);
  const [measuredH, setMeasuredH] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMeasuredW(width);
    setMeasuredH(height);
  }, []);

  const containerWidth = measuredW ?? windowWidth;
  const containerHeight = measuredH ?? windowHeight;
  const contentWidth = Math.max(0, containerWidth - horizontalPadding * 2);
  const yatay = containerWidth > containerHeight;
  const kisa = containerHeight < 480;

  return {
    containerWidth,
    containerHeight,
    contentWidth,
    onLayout,
    horizontalPadding,
    yatay,
    kisa,
    windowWidth,
    windowHeight,
  };
}

export function sutunSayisi(
  contentWidth: number,
  minItemWidth: number,
  gap: number,
  min: number,
  max: number
): number {
  if (contentWidth <= 0) return min;
  const cols = Math.floor((contentWidth + gap) / (minItemWidth + gap));
  return Math.max(min, Math.min(max, cols));
}

export function anaSayfaOlcegi(contentWidth: number, height: number, yatay: boolean) {
  const dar = contentWidth < 360;
  const genis = contentWidth >= 700 || (yatay && contentWidth >= 560);
  const orta = contentWidth >= 480;
  const kisa = height < 480 || yatay;

  // Yatayda daha çok sütun — butonlar alanı doldursun
  const hizliSutun = genis ? 6 : yatay ? (orta ? 5 : 4) : orta ? 4 : dar ? 2 : 3;
  const kestirmeMaxSutun = genis ? 6 : yatay ? 5 : dar ? 2 : 4;

  return {
    dar,
    genis,
    yatay,
    kisa,
    hizliSutun,
    hizliGap: dar ? 6 : 8,
    hizliHucreYukseklik: kisa ? (dar ? 56 : 60) : dar ? 68 : genis ? 76 : 70,
    hizliIcon: dar ? 15 : genis ? 20 : 17,
    hizliYazi: dar ? 10 : genis ? 12 : 11,
    kestirmeMinGenislik: yatay ? 120 : dar ? 100 : 112,
    kestirmeMaxSutun,
    kestirmeGap: 6,
    kestirmeYazi: dar ? 10 : 11,
    kestirmeIcon: dar ? 12 : 14,
  };
}

export function useAnaSayfaDuzeni(horizontalPadding = 14) {
  const olcu = useKapsayiciOlcu(horizontalPadding);
  const { contentWidth, containerHeight, yatay, onLayout, horizontalPadding: pad } = olcu;

  const olcek = useMemo(
    () => anaSayfaOlcegi(contentWidth, containerHeight, yatay),
    [contentWidth, containerHeight, yatay]
  );

  const kestirmeSutun = useMemo(
    () =>
      sutunSayisi(
        contentWidth,
        olcek.kestirmeMinGenislik,
        olcek.kestirmeGap,
        1,
        olcek.kestirmeMaxSutun
      ),
    [contentWidth, olcek.kestirmeMinGenislik, olcek.kestirmeGap, olcek.kestirmeMaxSutun]
  );

  return {
    onLayout,
    horizontalPadding: pad,
    contentWidth,
    olcek,
    kestirmeSutun,
    yatay,
    kisa: olcek.kisa,
  };
}
