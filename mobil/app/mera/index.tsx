import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { MeraHarita } from '@/bilesenler/mera/MeraHarita';
import { meraHaritaAktif } from '@/sabitler/ozellik-acik';

export default function MeraEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { padok } = useLocalSearchParams<{ padok?: string }>();
  const [secili, setSecili] = useState<string | null>(padok?.trim() || null);

  if (!meraHaritaAktif()) {
    return (
      <>
        <Stack.Screen options={{ title: 'Mera' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
            Mera haritası bu ortamda kapalı (özellik bayrağı).
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Mera' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <MeraHarita
          seciliPadok={secili}
          onPadokSec={(ad) => {
            setSecili(ad);
            router.push({ pathname: '/(tabs)/suru', params: { padok: ad } } as never);
          }}
        />
        {secili ? (
          <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            Seçili: {secili} · sürü listesine yönlendirildi
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 32 },
});
