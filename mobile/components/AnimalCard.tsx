import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { Animal } from '@/lib/types';
import { ANIMAL_STATUS_LABELS } from '@/lib/types';

export function AnimalCard({ animal, latestWeight }: { animal: Animal; latestWeight?: number | null }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const sexIcon = animal.sex === 'female' ? '♀' : '♂';

  return (
    <Link href={`/animal/${animal.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.row}>
          <Text style={[styles.tag, { color: colors.tint }]}>{animal.earTag}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {sexIcon} {animal.breed}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{animal.name || 'İsimsiz'}</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{animal.paddock}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {latestWeight != null ? `${latestWeight} kg` : '—'} · {ANIMAL_STATUS_LABELS[animal.status]}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    minHeight: 88,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 4,
  },
});
