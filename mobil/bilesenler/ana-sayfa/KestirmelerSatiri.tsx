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
  const { onLayout, horizontalPadding, olcek, kestirmeGenislik } = useAnaSayfaDuzeni();

  if (items.length === 0) return null;

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Kestirmeler</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{items.length} kısayol</Text>
      </View>
      <View
        style={[
          styles.grid,
          { paddingHorizontal: horizontalPadding, gap: olcek.kestirmeGap },
        ]}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.href as never)}
            style={({ pressed }) => [
              styles.chip,
              {
                width: kestirmeGenislik,
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text style={[styles.chipIcon, { fontSize: olcek.kestirmeIcon }]}>{item.icon}</Text>
            <Text
              style={[
                styles.chipText,
                { color: colors.text, fontSize: olcek.kestirmeYazi, lineHeight: olcek.kestirmeYazi + 4 },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 24,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
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
