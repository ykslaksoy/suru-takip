import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions } from 'react-native';

/** Gerçek kapsayıcı genişliği — web önizleme çerçevesi dahil */
export function useKapsayiciGenisligi(horizontalPadding = 16) {
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setMeasured(e.nativeEvent.layout.width);
  }, []);

  const containerWidth = measured ?? windowWidth;
  const contentWidth = Math.max(0, containerWidth - horizontalPadding * 2);

  return { containerWidth, contentWidth, onLayout, horizontalPadding };
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

export function ogeGenisligi(contentWidth: number, columns: number, gap: number): number {
  if (columns <= 0) return contentWidth;
  return (contentWidth - gap * (columns - 1)) / columns;
}

export function anaSayfaOlcegi(contentWidth: number, height: number) {
  const dar = contentWidth < 340;
  const genis = contentWidth >= 520;
  const kisa = height < 680;

  const hizliSutun = genis ? 4 : dar ? 2 : 3;

  return {
    dar,
    genis,
    kisa,
    hizliSutun,
    hizliGap: dar ? 6 : 8,
    hizliHucreYukseklik: kisa ? (dar ? 64 : 70) : dar ? 70 : genis ? 78 : 74,
    hizliIcon: dar ? 16 : genis ? 20 : 18,
    hizliYazi: dar ? 11 : genis ? 12 : 11,
    kestirmeMinGenislik: dar ? 100 : genis ? 130 : 112,
    kestirmeMaxSutun: genis ? 4 : dar ? 2 : 3,
    kestirmeGap: 6,
    kestirmeYazi: dar ? 10 : 11,
    kestirmeIcon: dar ? 12 : 14,
  };
}

export function useAnaSayfaDuzeni(horizontalPadding = 16) {
  const { height } = useWindowDimensions();
  const { contentWidth, onLayout, horizontalPadding: pad } = useKapsayiciGenisligi(horizontalPadding);

  const olcek = useMemo(() => anaSayfaOlcegi(contentWidth, height), [contentWidth, height]);

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

  const kestirmeGenislik = useMemo(
    () => ogeGenisligi(contentWidth, kestirmeSutun, olcek.kestirmeGap),
    [contentWidth, kestirmeSutun, olcek.kestirmeGap]
  );

  const hizliHucreGenislik = useMemo(
    () => ogeGenisligi(contentWidth, olcek.hizliSutun, olcek.hizliGap),
    [contentWidth, olcek.hizliSutun, olcek.hizliGap]
  );

  return {
    onLayout,
    horizontalPadding: pad,
    contentWidth,
    olcek,
    kestirmeSutun,
    kestirmeGenislik,
    hizliHucreGenislik,
  };
}
