import { StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcr, type FcrHesap } from '@/kaynak/kilo/fcr-hesap';
import { ensureRationPlan, getAnimalRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { sonYemSayimMiktari } from '@/kaynak/stok/yem-tuketim';
import { PHASE_LABELS } from '@/kaynak/rasyon/hesapla';
import { adgDeger, fcrDeger, terim } from '@/sabitler/Metinler';

const KAYNAK_ETIKET: Record<FcrHesap['kaynak'], string> = {
  gunluk_rasyon: 'günlük verilen rasyon × gün',
  stok_cikis: 'stok çıkış kayıtları',
  sayim_farki: 'yem sayım farkı',
};

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
  const [dailyGivenKg, setDailyGivenKg] = useState<number | null>(null);
  const [phaseLabel, setPhaseLabel] = useState<string>('');
  const [sonSayim, setSonSayim] = useState<number | null>(null);

  const load = useCallback(async () => {
    const a = await getAnimal(animalId);
    if (!a) return;

    const sorted = [...records].sort(
      (x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime()
    );
    const latestWeight = sorted[0]?.weightKg ?? null;
    const plan = (await ensureRationPlan(a, latestWeight)) ?? (await getAnimalRationPlan(animalId));
    setDailyGivenKg(plan?.dailyGivenKg ?? null);
    setPhaseLabel(plan ? PHASE_LABELS[plan.phase] : '');
    setSonSayim(await sonYemSayimMiktari());
    setFcrHesap(await hesaplaFcr(a, records));
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

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 4 }]}>Günlük verilen rasyon</Text>
      {dailyGivenKg != null ? (
        <>
          <Text style={[styles.value, { color: colors.text }]}>
            {dailyGivenKg.toLocaleString('tr-TR')} kg yem / gün / hayvan
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            Son tartıma göre · {phaseLabel || '—'}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Tartım kaydı olunca günlük rasyon otomatik hesaplanır.
        </Text>
      )}
      {sonSayim != null ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
          Son yem sayımı: {sonSayim.toLocaleString('tr-TR')} kg (stokta)
        </Text>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 6 }]}>{terim('FCR')}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
        Tartım dönemi + günlük rasyon + stok/sayım birlikte hesaplanır.
      </Text>

      {fcrHesap ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            {fcrHesap.periodDays} gün · +{fcrHesap.gainKg.toLocaleString('tr-TR')} kg artış (
            {fcrHesap.startWeightKg} → {fcrHesap.endWeightKg} kg)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            Verilen yem (dönem): {fcrHesap.totalFeedKg.toLocaleString('tr-TR')} kg · kaynak:{' '}
            {KAYNAK_ETIKET[fcrHesap.kaynak]}
          </Text>
          {fcrHesap.stokToplamKg != null && fcrHesap.kaynak !== 'gunluk_rasyon' ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Rasyon tahmini: {fcrHesap.rasyonToplamKg.toLocaleString('tr-TR')} kg · Stok/sayım:{' '}
              {fcrHesap.stokToplamKg.toLocaleString('tr-TR')} kg
            </Text>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Rasyon × gün: {fcrHesap.rasyonToplamKg.toLocaleString('tr-TR')} kg
            </Text>
          )}
          <Text style={[styles.value, { color: colors.tint }]}>{fcrDeger(fcrHesap.fcr)}</Text>
        </>
      ) : (
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          — (en az 2 tartım, pozitif artış ve rasyon gerekir)
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
