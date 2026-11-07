import { StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcrSonuc, type FcrHesap } from '@/kaynak/kilo/fcr-hesap';
import { ensureRationPlan, getAnimalRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { sonYemSayimMiktari } from '@/kaynak/stok/yem-tuketim';
import { PHASE_LABELS } from '@/kaynak/rasyon/hesapla';
import { fcrDeger, metrikBaslik, metrikTooltip, metrikYetersizVeri } from '@/sabitler/Metinler';
import { fcrYemBazAciklamasi } from '@/kaynak/kilo/performans-metrik-etiket';
import { YemAdgTablosu } from '@/bilesenler/kilo/YemAdgTablosu';

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
  const [fcrNeden, setFcrNeden] = useState<string | null>(null);
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
    const fcr = await hesaplaFcrSonuc(a, records);
    if (fcr.durum === 'hazir') {
      setFcrHesap(fcr.hesap);
      setFcrNeden(null);
    } else {
      setFcrHesap(null);
      setFcrNeden(fcr.neden);
    }
  }, [animalId, records]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.tint }]}>Performans</Text>

      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
        {metrikTooltip('GCAA')}
      </Text>

      <YemAdgTablosu gunlukYemKg={dailyGivenKg} adgGram={adg} />

      {dailyGivenKg != null ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
          Son tartıma göre rasyon · {phaseLabel || '—'}
        </Text>
      ) : null}
      {sonSayim != null ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
          Son yem sayımı: {sonSayim.toLocaleString('tr-TR')} kg (stokta)
        </Text>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.text, fontWeight: '800', marginBottom: 6 }]}>
        {metrikBaslik('FCR')}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
        {metrikTooltip('FCR')}
      </Text>

      {fcrHesap ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            {fcrHesap.periodDays} gün · +{fcrHesap.gainKg.toLocaleString('tr-TR')} kg artış (
            {fcrHesap.startWeightKg} → {fcrHesap.endWeightKg} kg)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
            Verilen yem (dönem): {fcrHesap.totalFeedKg.toLocaleString('tr-TR')} kg · {KAYNAK_ETIKET[fcrHesap.kaynak]}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, lineHeight: 17 }}>
            {fcrYemBazAciklamasi(fcrHesap.kaynak)}
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
          — {fcrNeden ?? metrikYetersizVeri('FCR')}
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
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
});
