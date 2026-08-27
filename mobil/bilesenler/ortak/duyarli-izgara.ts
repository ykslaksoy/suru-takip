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
    hizliGap: dar ? 8 : 10,
    hizliHucreYukseklik: kisa ? (dar ? 72 : 80) : dar ? 84 : genis ? 104 : 96,
    hizliIcon: dar ? 22 : genis ? 28 : 26,
    hizliYazi: dar ? 11 : genis ? 13 : 12,
    kestirmeMinGenislik: dar ? 112 : genis ? 148 : 128,
    kestirmeMaxSutun: genis ? 4 : dar ? 2 : 3,
    kestirmeGap: 8,
    kestirmeYazi: dar ? 11 : 12,
    kestirmeIcon: dar ? 14 : 16,
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
