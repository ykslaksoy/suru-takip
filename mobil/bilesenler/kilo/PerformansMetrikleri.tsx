import { StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { calculateFCR, weightGainKg } from '@/kaynak/kilo/fcr';
import { adgDeger, fcrDeger, terim } from '@/sabitler/Metinler';

const feedKey = (animalId: string) => `suruyon_fcr_feed_${animalId}`;

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
  const [feedKg, setFeedKg] = useState('');
  const gainKg = weightGainKg(records);
  const fcr = calculateFCR(parseFloat(feedKg) || 0, gainKg ?? 0);

  const loadFeed = useCallback(async () => {
    const saved = await AsyncStorage.getItem(feedKey(animalId));
    if (saved) setFeedKg(saved);
  }, [animalId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const saveFeed = async (value: string) => {
    setFeedKg(value);
    if (value.trim()) await AsyncStorage.setItem(feedKey(animalId), value);
    else await AsyncStorage.removeItem(feedKey(animalId));
  };

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

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 6 }]}>{terim('FCR')}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
        Son 30 günde bu hayvana verilen toplam yem miktarını gir; tartımlardan kilo artışına göre hesaplanır.
      </Text>
      <TextInput
        placeholder="Son 30 günde verilen yem (kg)"
        keyboardType="decimal-pad"
        value={feedKg}
        onChangeText={saveFeed}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {gainKg != null ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
          Dönem artışı: +{gainKg.toLocaleString('tr-TR')} kg
        </Text>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>
          FCR için en az iki tartım ve pozitif kilo artışı gerekir.
        </Text>
      )}
      <Text style={[styles.value, { color: fcr != null ? colors.tint : colors.textSecondary }]}>
        {fcr != null ? fcrDeger(fcr) : '—'}
      </Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
    marginBottom: 8,
  },
});
