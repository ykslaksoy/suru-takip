import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { rasyonKarsilastirma, type KarsilastirmaSatiri } from '@/kaynak/rasyon/karsilastirma';

function Satir({
  s,
  colors,
}: {
  s: KarsilastirmaSatiri;
  colors: (typeof Colors)['light'];
}) {
  const renk =
    s.durum === 'iyi' ? colors.success : s.durum === 'kotu' ? colors.danger : colors.textSecondary;
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[styles.metrik, { color: colors.text }]}>{s.metrik}</Text>
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{s.oneri}</Text>
      <Text style={{ color: colors.text, flex: 1, fontWeight: '700' }}>{s.gercek}</Text>
      <Text style={{ color: renk, fontWeight: '800', minWidth: 72, textAlign: 'right' }}>{s.fark}</Text>
    </View>
  );
}

export function KarsilastirmaTablosu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [satirlar, setSatirlar] = useState<KarsilastirmaSatiri[]>([]);
  const [ozet, setOzet] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await rasyonKarsilastirma();
      setSatirlar(r?.satirlar ?? []);
      setOzet(r?.ozet ?? 'Sürü ve tartım kaydı olunca karşılaştırma görünür.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator style={{ marginVertical: 24 }} color={colors.tint} />;
  }

  return (
    <View>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Akıllı öneri ile sürüde gerçekleşen ortalamalar. Yeşil = hedefe uygun.
      </Text>
      <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={[styles.head, { borderColor: colors.border }]}>
          <Text style={[styles.headCell, { color: colors.textSecondary }]}>Metrik</Text>
          <Text style={[styles.headCell, { color: colors.textSecondary }]}>Öneri</Text>
          <Text style={[styles.headCell, { color: colors.textSecondary }]}>Gerçek</Text>
          <Text style={[styles.headCell, { color: colors.textSecondary, textAlign: 'right' }]}>Fark</Text>
        </View>
        {satirlar.map((s) => (
          <Satir key={s.metrik} s={s} colors={colors} />
        ))}
      </View>
      <Text style={{ color: colors.text, marginTop: 12, lineHeight: 20 }}>{ozet}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12, lineHeight: 20 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', borderBottomWidth: 1, padding: 10, gap: 6 },
  headCell: { flex: 1, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, padding: 10, gap: 6 },
  metrik: { flex: 1, fontWeight: '700' },
});
