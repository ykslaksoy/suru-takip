import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { YolculukAdimi } from '@/bilesenler/besi/YolculukAdimi';
import {
  MOD1_ADIMLAR,
  adimAcikMi,
  adimTamamla,
  getMod1Ilerleme,
  resetMod1Ilerleme,
  sonrakiAcikAdim,
  type BesiAdimId,
  type Mod1Ilerleme,
} from '@/kaynak/besi-ortak';
import { getMod } from '@/sabitler/Modlar';

export default function BesiYolculukScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const mod = getMod('mod1');
  const [ilerleme, setIlerleme] = useState<Mod1Ilerleme>({ tamamlanan: [], guncelleme: '' });

  const load = useCallback(async () => {
    setIlerleme(await getMod1Ilerleme());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sonraki = sonrakiAcikAdim(ilerleme.tamamlanan);

  const durumOf = (id: BesiAdimId) => {
    const adim = MOD1_ADIMLAR.find((a) => a.id === id)!;
    if (ilerleme.tamamlanan.includes(id)) return 'tamam' as const;
    if (adimAcikMi(adim, ilerleme.tamamlanan)) return 'aktif' as const;
    return 'kilitli' as const;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>{mod.baslik}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {mod.aciklama} Adımlar sırayla açılır.
      </Text>

      {sonraki ? (
        <View style={[styles.nextBox, { backgroundColor: colors.tint }]}>
          <Text style={styles.nextLabel}>Şimdi</Text>
          <Text style={styles.nextTitle}>{sonraki.baslik}</Text>
          <Text style={styles.nextDesc}>{sonraki.aciklama}</Text>
        </View>
      ) : (
        <View style={[styles.nextBox, { backgroundColor: colors.success }]}>
          <Text style={styles.nextTitle}>Yolculuk tamam</Text>
          <Text style={styles.nextDesc}>Tüm adımlar işlendi. Metrikleri Akıllı Kuzu’dan izleyin.</Text>
        </View>
      )}

      {MOD1_ADIMLAR.map((adim) => {
        const durum = durumOf(adim.id);
        return (
          <YolculukAdimi
            key={adim.id}
            adim={adim}
            durum={durum}
            onPress={
              durum === 'kilitli'
                ? undefined
                : () => {
                    if (adim.href) router.push(adim.href as never);
                  }
            }
            onTamamla={
              durum === 'aktif'
                ? async () => {
                    setIlerleme(await adimTamamla(adim.id));
                  }
                : undefined
            }
          />
        );
      })}

      <Pressable
        onPress={() => {
          Alert.alert('Sıfırla', 'Mod 1 ilerlemesi başa döner.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Sıfırla',
              style: 'destructive',
              onPress: async () => setIlerleme(await resetMod1Ilerleme()),
            },
          ]);
        }}
        style={{ marginTop: 8, marginBottom: 24 }}>
        <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '700' }}>
          Yolculuğu sıfırla
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800' },
  sub: { marginTop: 6, marginBottom: 16, lineHeight: 20 },
  nextBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  nextLabel: { color: '#ffffffcc', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  nextTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  nextDesc: { color: '#ffffffee', marginTop: 4, lineHeight: 18 },
});
