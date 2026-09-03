import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAnaSayfaDuzeni } from '@/bilesenler/ortak/duyarli-izgara';
import { KESTIRMELER, type MenuOgesi } from '@/kaynak/ana-sayfa';

interface Props {
  items?: MenuOgesi[];
}

/** 3 sütunlu yoğun kestirme şeridi */
export function KestirmelerSatiri({ items = KESTIRMELER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { onLayout, horizontalPadding, olcek, kestirmeGenislik, kestirmeSutun } =
    useAnaSayfaDuzeni();

  if (items.length === 0) return null;

  const sutun = Math.min(3, Math.max(2, kestirmeSutun));
  const rows: MenuOgesi[][] = [];
  for (let i = 0; i < items.length; i += sutun) {
    rows.push(items.slice(i, i + sutun));
  }

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      <View style={StyleSheet.flatten([styles.headerRow, { paddingHorizontal: horizontalPadding }])}>
        <Text style={StyleSheet.flatten([styles.title, { color: colors.textSecondary }])}>
          Kestirmeler
        </Text>
        <Text style={StyleSheet.flatten([styles.count, { color: colors.textSecondary }])}>
          {items.length}
        </Text>
      </View>
      <View
        style={StyleSheet.flatten([
          styles.list,
          { paddingHorizontal: horizontalPadding, gap: Math.min(6, olcek.kestirmeGap) },
        ])}>
        {rows.map((row, rowIndex) => (
          <View
            key={`kr-${rowIndex}`}
            style={StyleSheet.flatten([styles.row, { gap: Math.min(6, olcek.kestirmeGap) }])}>
            {row.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.push(item.href as never)}
                style={({ pressed }) =>
                  StyleSheet.flatten([
                    styles.chip,
                    {
                      width: kestirmeGenislik,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ])
                }>
                <View
                  style={StyleSheet.flatten([
                    styles.iconDot,
                    { backgroundColor: colors.tint + '16' },
                  ])}>
                  <Text style={styles.chipIcon}>{item.icon}</Text>
                </View>
                <Text
                  style={StyleSheet.flatten([
                    styles.chipText,
                    {
                      color: colors.text,
                      fontSize: Math.min(11, olcek.kestirmeYazi),
                      lineHeight: 14,
                    },
                  ])}
                  numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
            {row.length < sutun
              ? Array.from({ length: sutun - row.length }).map((_, i) => (
                  <View key={`sp-${rowIndex}-${i}`} style={{ width: kestirmeGenislik }} />
                ))
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 2,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
  },
  list: {},
  row: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 38,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIcon: {
    fontSize: 12,
    textAlign: 'center',
  },
  chipText: {
    flex: 1,
    fontWeight: '600',
  },
});
