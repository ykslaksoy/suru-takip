import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { KESTIRMELER, type Kestirme } from '@/kaynak/ana-sayfa';

interface Props {
  items?: Kestirme[];
}

export function KestirmelerSatiri({ items = KESTIRMELER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Kestirmeler</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.href as never)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
