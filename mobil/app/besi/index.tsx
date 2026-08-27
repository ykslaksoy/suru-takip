import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
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
import { useMod } from '@/baglam/ModBaglami';

export default function BesiYolculukScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktifMod } = useMod();
  const navigation = useNavigation();
  const [ilerleme, setIlerleme] = useState<Mod1Ilerleme>({ tamamlanan: [], guncelleme: '' });

  const load = useCallback(async () => {
    setIlerleme(await getMod1Ilerleme());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ title: aktifMod.baslik });
  }, [navigation, aktifMod.baslik]);

  /** Mod 1 dışındakiler — isim görünür, yolculuk yakında */
  if (aktifMod.id !== 'mod1') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {aktifMod.icon} {aktifMod.baslik}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{aktifMod.aciklama}</Text>
        <View style={[styles.nextBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.soonTitle, { color: colors.text }]}>Yolculuk yakında</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            {aktifMod.baslik} adımları bir sonraki sürümde açılacak. Şimdilik Ayarlar’dan başka moda
            geçebilir veya sürü / stok işlemlerini kullanabilirsiniz.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/ayarlar' as never)}
          style={[styles.cta, { backgroundColor: colors.tint }]}>
          <Text style={styles.ctaText}>Mod değiştir →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const sonraki = sonrakiAcikAdim(ilerleme.tamamlanan);

  const durumOf = (id: BesiAdimId) => {
    const adim = MOD1_ADIMLAR.find((a) => a.id === id)!;
    if (ilerleme.tamamlanan.includes(id)) return 'tamam' as const;
    if (adimAcikMi(adim, ilerleme.tamamlanan)) return 'aktif' as const;
    return 'kilitli' as const;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>
        {aktifMod.icon} {aktifMod.baslik}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {aktifMod.aciklama} Adımlar sırayla açılır.
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
          Alert.alert('Sıfırla', `${aktifMod.baslik} ilerlemesi başa döner.`, [
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
  soonTitle: { fontWeight: '800', fontSize: 18 },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
});
