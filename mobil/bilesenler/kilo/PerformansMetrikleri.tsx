import { StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcr, type FcrHesap } from '@/kaynak/kilo/fcr-hesap';
import { ensureRationPlan, getAnimalRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { PHASE_LABELS } from '@/kaynak/rasyon/hesapla';
import { adgDeger, fcrDeger, terim } from '@/sabitler/Metinler';

export function PerformansMetrikleri({
  animalId,
  adg,
  records,
}: {
  animalId: string;
  adg: number | null;
  records: WeightRecord[];
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [fcrHesap, setFcrHesap] = useState<FcrHesap | null>(null);
  const [dailyFeedKg, setDailyFeedKg] = useState<number | null>(null);
  const [phaseLabel, setPhaseLabel] = useState<string>('');

  const load = useCallback(async () => {
    const a = await getAnimal(animalId);
    if (!a) return;

    const sorted = [...records].sort(
      (x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime()
    );
    const latestWeight = sorted[0]?.weightKg ?? null;
    const plan = (await ensureRationPlan(a, latestWeight)) ?? (await getAnimalRationPlan(animalId));
    setDailyFeedKg(plan?.dailyFeedKg ?? null);
    setPhaseLabel(plan ? PHASE_LABELS[plan.phase] : '');

    setFcrHesap(hesaplaFcr(a, records));
  }, [animalId, records]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.tint }]}>Performans</Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{terim('ADG')} · 30 gün</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {adg != null ? adgDeger(adg) : '— (en az 2 tartım)'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 4 }]}>Günlük rasyon</Text>
      {dailyFeedKg != null ? (
        <>
          <Text style={[styles.value, { color: colors.text }]}>
            {dailyFeedKg.toLocaleString('tr-TR')} kg yem / gün
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            Son tartıma göre otomatik · {phaseLabel || '—'}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Tartım kaydı olunca günlük rasyon otomatik hesaplanır.
        </Text>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 6 }]}>{terim('FCR')}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
        Günlük rasyon × tartım dönemi gün sayısı ÷ kilo artışı — otomatik hesaplanır.
      </Text>

      {fcrHesap ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            {fcrHesap.periodDays} gün · +{fcrHesap.gainKg.toLocaleString('tr-TR')} kg artış (
            {fcrHesap.startWeightKg} → {fcrHesap.endWeightKg} kg)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
            Tahmini yem: {fcrHesap.totalFeedKg.toLocaleString('tr-TR')} kg (
            {fcrHesap.dailyFeedKg.toLocaleString('tr-TR')} kg/gün ort.)
          </Text>
          <Text style={[styles.value, { color: colors.tint }]}>{fcrDeger(fcrHesap.fcr)}</Text>
        </>
      ) : (
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          — (en az 2 tartım ve pozitif artış gerekir)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { fontWeight: '800', fontSize: 16, marginBottom: 12 },
  row: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
});
