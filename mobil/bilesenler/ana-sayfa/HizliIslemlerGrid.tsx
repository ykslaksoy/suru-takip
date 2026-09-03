import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAnaSayfaDuzeni } from '@/bilesenler/ortak/duyarli-izgara';
import { HIZLI_ISLEMLER, type MenuOgesi } from '@/kaynak/ana-sayfa';

interface Props {
  items?: MenuOgesi[];
}

/** Flex tabanlı hızlı işlemler — yatay/dikeyde sütun sayısı dinamik */
export function HizliIslemlerGrid({ items = HIZLI_ISLEMLER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { onLayout, horizontalPadding, olcek } = useAnaSayfaDuzeni();

  const rows: MenuOgesi[][] = [];
  for (let i = 0; i < items.length; i += olcek.hizliSutun) {
    rows.push(items.slice(i, i + olcek.hizliSutun));
  }

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.flatten([
        styles.grid,
        { paddingHorizontal: horizontalPadding, gap: olcek.hizliGap },
      ])}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={StyleSheet.flatten([styles.row, { gap: olcek.hizliGap }])}>
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
                    flex: 1,
                    minHeight: olcek.hizliHucreYukseklik,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ])
              }>
              <View
                style={StyleSheet.flatten([
                  styles.iconBadge,
                  {
                    backgroundColor: colors.tint + '18',
                    width: olcek.kisa ? 28 : 32,
                    height: olcek.kisa ? 28 : 32,
                    borderRadius: olcek.kisa ? 9 : 10,
                  },
                ])}>
                <Text style={{ fontSize: olcek.hizliIcon }}>{item.icon}</Text>
              </View>
              <Text
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: colors.text,
                    fontSize: olcek.hizliYazi,
                    lineHeight: olcek.hizliYazi + 3,
                  },
                ])}
                numberOfLines={olcek.yatay ? 1 : 2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          {row.length < olcek.hizliSutun
            ? Array.from({ length: olcek.hizliSutun - row.length }).map((_, i) => (
                <View key={`spacer-${rowIndex}-${i}`} style={styles.spacer} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginBottom: 4, width: '100%' },
  row: { flexDirection: 'row', width: '100%' },
  cell: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 4,
    minWidth: 0,
  },
  spacer: { flex: 1, minWidth: 0 },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
});
