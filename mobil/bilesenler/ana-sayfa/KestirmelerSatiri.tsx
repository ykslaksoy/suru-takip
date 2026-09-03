import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAnaSayfaDuzeni } from '@/bilesenler/ortak/duyarli-izgara';
import { KESTIRMELER, type MenuOgesi } from '@/kaynak/ana-sayfa';

interface Props {
  items?: MenuOgesi[];
}

export function KestirmelerSatiri({ items = KESTIRMELER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { onLayout, horizontalPadding, olcek, kestirmeGenislik, kestirmeSutun } =
    useAnaSayfaDuzeni();

  if (items.length === 0) return null;

  const rows: MenuOgesi[][] = [];
  for (let i = 0; i < items.length; i += kestirmeSutun) {
    rows.push(items.slice(i, i + kestirmeSutun));
  }

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Kestirmeler</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{items.length} kısayol</Text>
      </View>
      <View style={[styles.list, { paddingHorizontal: horizontalPadding, gap: olcek.kestirmeGap }]}>
        {rows.map((row, rowIndex) => (
          <View key={`kr-${rowIndex}`} style={[styles.row, { gap: olcek.kestirmeGap }]}>
            {row.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.push(item.href as never)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    width: kestirmeGenislik,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    minHeight: olcek.dar ? 44 : 48,
                  },
                ]}>
                <Text style={[styles.chipIcon, { fontSize: olcek.kestirmeIcon }]}>{item.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: colors.text,
                      fontSize: olcek.kestirmeYazi,
                      lineHeight: olcek.kestirmeYazi + 4,
                    },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
            {row.length < kestirmeSutun
              ? Array.from({ length: kestirmeSutun - row.length }).map((_, i) => (
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {},
  row: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipIcon: {
    width: 22,
    textAlign: 'center',
  },
  chipText: {
    flex: 1,
    fontWeight: '600',
  },
});
