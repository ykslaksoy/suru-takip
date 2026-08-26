import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { calculateRation, PHASE_LABELS, type RationPhase } from '@/kaynak/rasyon/hesapla';

export default function RationScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liveWeight, setLiveWeight] = useState('65');
  const [count, setCount] = useState('100');
  const [phase, setPhase] = useState<RationPhase>('maintenance');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [result, setResult] = useState<ReturnType<typeof calculateRation> | null>(null);

  const calc = () => {
    setResult(
      calculateRation({
        liveWeightKg: parseFloat(liveWeight) || 0,
        count: parseInt(count, 10) || 0,
        phase,
        forageQuality: quality,
      })
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Canlı ağırlık ve döneme göre günlük kuru madde / yem ihtiyacı hesaplayıcı (v1.0)
      </Text>

      <TextInput
        placeholder="Ortalama canlı ağırlık (kg)"
        keyboardType="decimal-pad"
        value={liveWeight}
        onChangeText={setLiveWeight}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Hayvan sayısı"
        keyboardType="number-pad"
        value={count}
        onChangeText={setCount}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Dönem</Text>
      <View style={styles.row}>
        {(Object.keys(PHASE_LABELS) as RationPhase[]).map((p) => (
          <AnaButon
            key={p}
            title={PHASE_LABELS[p]}
            variant={phase === p ? 'primary' : 'secondary'}
            onPress={() => setPhase(p)}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Kaba yem kalitesi</Text>
      <View style={styles.row}>
        {(['low', 'medium', 'high'] as const).map((q) => (
          <AnaButon
            key={q}
            title={q === 'low' ? 'Düşük' : q === 'medium' ? 'Orta' : 'Yüksek'}
            variant={quality === q ? 'primary' : 'secondary'}
            onPress={() => setQuality(q)}
          />
        ))}
      </View>

      <AnaButon title="Hesapla" onPress={calc} />

      {result && (
        <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultTitle, { color: colors.tint }]}>Sonuç</Text>
          <Text style={{ color: colors.text }}>Kuru madde/hayvan/gün: {result.dmRequirementKg} kg</Text>
          <Text style={{ color: colors.text }}>Yem/hayvan/gün: {result.dailyFeedKg} kg</Text>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Toplam sürü/gün: {result.totalDailyKg} kg</Text>
          <Text style={{ color: colors.text }}>Hedef protein: %{result.proteinPercent}</Text>
          {result.notes.map((n, i) => (
            <Text key={i} style={{ color: colors.textSecondary, marginTop: 4 }}>• {n}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  intro: { marginBottom: 16, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, minHeight: 48 },
  label: { fontWeight: '600', marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  result: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1 },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
});
