import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

export function KiloGrafigi({
  records,
  referans,
}: {
  records: WeightRecord[];
  /** Tarih için beklenen kilo (referans eğri) — verilirse çubuk üstünde çizgi */
  referans?: (at: string) => number | null;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const sorted = [...records].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const refler = sorted.map((r) => (referans ? referans(r.recordedAt) : null));
  const tum = [...sorted.map((r) => r.weightKg), ...refler.filter((x): x is number => x != null)];
  const max = Math.max(...tum, 1);
  const min = Math.min(...tum, 0);
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
        {sorted.slice(-10).map((r, i, arr) => {
          const height = ((r.weightKg - min) / range) * 80 + 20;
          const ref = refler[sorted.length - arr.length + i];
          const refH = ref != null ? ((ref - min) / range) * 80 + 20 : null;
          const altinda = ref != null && r.weightKg < ref * 0.9;
          return (
            <View key={r.id} style={styles.barCol}>
              <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>{String(r.weightKg).replace('.', ',')}</Text>
              <View style={{ height: 100, justifyContent: 'flex-end' }}>
                {refH != null ? (
                  <View style={{ position: 'absolute', bottom: refH, left: -4, right: -4, height: 2, backgroundColor: colors.warning }} />
                ) : null}
                <View style={[styles.bar, { height, backgroundColor: altinda ? colors.warning : colors.tint }]} />
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {new Date(r.recordedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          );
        })}
      </View>
      {referans ? (
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>
          Turuncu çizgi: referans eğri (varsayılan, Hızlı tartım ayarından değişir)
        </Text>
      ) : null}
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
    height: 140,
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
