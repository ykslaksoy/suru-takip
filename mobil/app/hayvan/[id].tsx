import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { calculateADG, deleteAnimal, getAnimal, getLatestWeight, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { ANIMAL_STATUS_LABELS } from '@/kaynak/cekirdek/tipler';
import { TURKVET_FIELD_LABELS } from '@/kaynak/turkvet/dogrula';
import { ageInMonths, bandForAge, gradeFromAdg, dereceEtiket, type KuzuGrade } from '@/kaynak/kilo/kuzu-derece';
import { hesaplaFcr } from '@/kaynak/kilo/fcr-hesap';
import { ensureRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { DereceRozeti } from '@/bilesenler/kilo/DereceRozeti';
import { terim, adgDeger, fcrDeger } from '@/sabitler/Metinler';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [adg, setAdg] = useState<number | null>(null);
  const [grade, setGrade] = useState<KuzuGrade | null>(null);
  const [fcrValue, setFcrValue] = useState<number | null>(null);
  const [dailyRation, setDailyRation] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const a = await getAnimal(id);
      setAnimal(a);
      if (a) {
        const w = await getLatestWeight(a.id);
        const g = await calculateADG(a.id);
        const records = await getWeightRecords(a.id);
        const fcr = await hesaplaFcr(a, records);
        const plan = await ensureRationPlan(a, w);
        setWeight(w);
        setAdg(g);
        setFcrValue(fcr?.fcr ?? null);
        setDailyRation(fcr?.dailyGivenKg ?? plan?.dailyGivenKg ?? null);
        setGrade(
          gradeFromAdg(g, {
            birthDate: a.birthDate,
            isSick: a.status === 'sick',
            fcr: fcr?.fcr ?? null,
          })
        );
      }
    })();
  }, [id, refreshKey]);

  if (!animal) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Yükleniyor...</Text>
      </View>
    );
  }

  const sexLabel = animal.sex === 'female' ? 'Dişi ♀' : 'Erkek ♂';
  const avatar = grade?.emoji ?? '🐑';
  const ageMonths = ageInMonths(animal.birthDate);
  const ageBand = bandForAge(ageMonths);
  const ageLabel =
    ageMonths != null ? `~${ageMonths} ay · ${ageBand.label}` : ageBand.label;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.card,
            borderColor: grade && grade.id !== 'bilinmiyor' ? grade.color : colors.border,
            borderWidth: grade && grade.level >= 4 ? 2 : 1,
          },
        ]}>
        <Text style={{ fontSize: 52, textAlign: 'center' }}>{avatar}</Text>
        {grade ? (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <DereceRozeti grade={grade} />
          </View>
        ) : null}
        <Text style={[styles.tag, { color: colors.tint }]}>{animal.earTag}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{animal.name || 'İsimsiz'}</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {animal.breed} · {sexLabel} · {ANIMAL_STATUS_LABELS[animal.status]}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
          {ageLabel}
        </Text>
        {grade ? (
          <Text style={{ color: grade.color, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
            {grade.short}
          </Text>
        ) : null}
        {grade ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
            {grade.hint}
          </Text>
        ) : null}
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>{animal.paddock}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Resmi Kayıt (TÜRKVET / GEKİS)</Text>
        <InfoRow label={TURKVET_FIELD_LABELS.turkvetNo} value={animal.turkvetNo || '—'} colors={colors} />
        <InfoRow label={TURKVET_FIELD_LABELS.gehisId} value={animal.gehisId || '—'} colors={colors} />
        <InfoRow label={TURKVET_FIELD_LABELS.birthDate} value={animal.birthDate || '—'} colors={colors} />
        <InfoRow label={TURKVET_FIELD_LABELS.motherId} value={animal.motherId || '—'} colors={colors} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Performans</Text>
        <InfoRow label="Yaş bandı" value={ageLabel} colors={colors} />
        <InfoRow label="Derece" value={grade ? dereceEtiket(grade) : '—'} colors={colors} />
        <InfoRow label="Son tartım" value={weight != null ? `${weight} kg` : '—'} colors={colors} />
        <InfoRow label={`${terim('ADG')} · 30 gün`} value={adg != null ? adgDeger(adg) : '—'} colors={colors} />
        <InfoRow
          label="Günlük verilen rasyon"
          value={dailyRation != null ? `${dailyRation.toLocaleString('tr-TR')} kg/gün` : '—'}
          colors={colors}
        />
        <InfoRow label={terim('FCR')} value={fcrValue != null ? fcrDeger(fcrValue) : '—'} colors={colors} />
      </View>

      <View style={styles.actions}>
        <Link href={`/hayvan/${animal.id}/kilo`} asChild>
          <Pressable style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.tint }])}>
            <Text style={styles.actionText}>📊 Kilo Takibi</Text>
          </Pressable>
        </Link>
        <Link href={`/hayvan/${animal.id}/saglik`} asChild>
          <Pressable style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.accent }])}>
            <Text style={[styles.actionText, { color: colors.text }]}>💊 Sağlık</Text>
          </Pressable>
        </Link>
      </View>

      {animal.notes ? (
        <Text style={[styles.notes, { color: colors.textSecondary }]}>Not: {animal.notes}</Text>
      ) : null}

      <View style={{ padding: 16 }}>
        <AnaButon
          title="Hayvanı Sil"
          variant="danger"
          onPress={() => {
            Alert.alert('Sil', 'Bu hayvan kaydını silmek istediğinize emin misiniz?', [
              { text: 'İptal', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                  await deleteAnimal(animal.id);
                  refresh();
                  router.back();
                },
              },
            ]);
          }}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  tag: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 6 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  actionBtn: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  notes: { padding: 16, fontStyle: 'italic' },
});
