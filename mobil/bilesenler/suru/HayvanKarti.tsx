import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { ANIMAL_STATUS_LABELS } from '@/kaynak/cekirdek/tipler';
import { DereceRozeti } from '@/bilesenler/kilo/DereceRozeti';
import type { KuzuGrade } from '@/kaynak/kilo/kuzu-derece';

export function HayvanKarti({
  animal,
  latestWeight,
  grade,
}: {
  animal: Animal;
  latestWeight?: number | null;
  grade?: KuzuGrade | null;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const sexIcon = animal.sex === 'female' ? '♀' : '♂';
  const avatar = grade?.emoji ?? '🐑';

  return (
    <Link href={`/hayvan/${animal.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: grade && grade.id !== 'bilinmiyor' ? grade.color : colors.border,
            opacity: pressed ? 0.85 : 1,
            borderWidth: grade && grade.level >= 4 ? 2 : 1,
          },
        ]}>
        <View style={styles.row}>
          <Text style={[styles.tag, { color: colors.tint }]}>{animal.earTag}</Text>
          {grade ? <DereceRozeti grade={grade} /> : null}
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.avatar}>{avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{animal.name || 'İsimsiz'}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {sexIcon} {animal.breed}
              {grade && grade.id !== 'bilinmiyor' ? ` · ${grade.short}` : ''}
            </Text>
          </View>
        </View>
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
    padding: 16,
    marginBottom: 10,
    minHeight: 88,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  avatar: { fontSize: 28 },
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
  },
});
