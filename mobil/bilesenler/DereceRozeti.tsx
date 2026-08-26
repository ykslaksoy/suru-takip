import { StyleSheet, Text, View } from 'react-native';
import type { KuzuGrade } from '@/kaynak/kuzu-derece';

export function DereceRozeti({
  grade,
  compact = false,
}: {
  grade: KuzuGrade;
  compact?: boolean;
}) {
  return (
    <View style={[styles.badge, { borderColor: grade.color, backgroundColor: grade.color + '18' }]}>
      <Text style={styles.emoji}>{grade.emoji}</Text>
      {!compact ? (
        <Text style={[styles.label, { color: grade.color }]}>{grade.label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: '800' },
});
