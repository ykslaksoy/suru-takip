import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAnaSayfaDuzeni } from '@/bilesenler/ortak/duyarli-izgara';
import { HIZLI_ISLEMLER, type MenuOgesi } from '@/kaynak/ana-sayfa';

interface Props {
  items?: MenuOgesi[];
}

/** Kompakt hızlı işlem kartları — ikon rozetli */
export function HizliIslemlerGrid({ items = HIZLI_ISLEMLER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { onLayout, horizontalPadding, olcek, hizliHucreGenislik } = useAnaSayfaDuzeni();

  const rows: MenuOgesi[][] = [];
  for (let i = 0; i < items.length; i += olcek.hizliSutun) {
    rows.push(items.slice(i, i + olcek.hizliSutun));
  }

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.flatten([
        styles.grid,
        { paddingHorizontal: horizontalPadding, gap: Math.min(8, olcek.hizliGap) },
      ])}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={StyleSheet.flatten([styles.row, { gap: Math.min(8, olcek.hizliGap) }])}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.cell,
                  {
                    width: hizliHucreGenislik,
                    minHeight: Math.min(72, olcek.hizliHucreYukseklik),
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ])
              }>
              <View
                style={StyleSheet.flatten([
                  styles.iconBadge,
                  { backgroundColor: colors.tint + '18' },
                ])}>
                <Text
                  style={StyleSheet.flatten([
                    styles.icon,
                    { fontSize: Math.min(18, olcek.hizliIcon) },
                  ])}>
                  {item.icon}
                </Text>
              </View>
              <Text
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: colors.text,
                    fontSize: Math.min(12, olcek.hizliYazi),
                    lineHeight: Math.min(12, olcek.hizliYazi) + 3,
                  },
                ])}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          {row.length < olcek.hizliSutun
            ? Array.from({ length: olcek.hizliSutun - row.length }).map((_, i) => (
                <View key={`spacer-${rowIndex}-${i}`} style={{ width: hizliHucreGenislik }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginBottom: 4 },
  row: { flexDirection: 'row' },
  cell: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 4,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {},
  label: {
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
});
