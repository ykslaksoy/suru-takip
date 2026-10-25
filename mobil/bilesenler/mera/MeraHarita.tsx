import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { meraHaritaPadoklarlaSenkron, type MeraHaritaBelge } from '@/kaynak/mera/harita';

type Props = {
  seciliPadok?: string | null;
  onPadokSec?: (ad: string) => void;
};

/** Native: liste görünümü (harita web’de Leaflet). */
export function MeraHarita({ seciliPadok, onPadokSec }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [belge, setBelge] = useState<MeraHaritaBelge | null>(null);

  useEffect(() => {
    void meraHaritaPadoklarlaSenkron().then(setBelge);
  }, []);

  const ozellikler = belge?.padoklar.features ?? [];

  return (
    <ScrollView style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.baslik, { color: colors.text }]}>Padok konumları (liste)</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        Tam harita web sürümünde. Koordinatlar yerel GeoJSON’da saklanır.
      </Text>
      {ozellikler.map((f) => {
        const ad = f.properties.padokAd;
        const secili = seciliPadok === ad;
        return (
          <Pressable
            key={ad}
            onPress={() => onPadokSec?.(ad)}
            style={[
              styles.satir,
              { borderColor: colors.border, backgroundColor: secili ? colors.tint + '12' : colors.background },
            ]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{ad}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {f.properties.hayvan ?? 0}/{f.properties.kapasite ?? '—'} · {f.geometry.coordinates.map((c) => c.toFixed(4)).join(', ')}
            </Text>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push('/(tabs)/suru' as never)} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.tint, fontWeight: '800' }}>← Sürü listesi</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 200 },
  baslik: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  satir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
});
