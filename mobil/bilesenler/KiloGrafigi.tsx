import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/tipler';

export function KiloGrafigi({ records }: { records: WeightRecord[] }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const sorted = [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const max = Math.max(...sorted.map((r) => r.weightKg), 1);
  const min = Math.min(...sorted.map((r) => r.weightKg), 0);
  const range = max - min || 1;

  if (sorted.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Text style={{ color: colors.textSecondary }}>Henüz tartım kaydı yok</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.bars}>
        {sorted.map((r) => {
          const height = ((r.weightKg - min) / range) * 80 + 20;
          return (
            <View key={r.id} style={styles.barCol}>
              <View style={[styles.bar, { height, backgroundColor: colors.tint }]} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {new Date(r.recordedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 8,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
});
