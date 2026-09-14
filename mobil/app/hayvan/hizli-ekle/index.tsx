import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

/** Hub — tek veya toplu; saha için iki büyük yol */
export default function HizliKuzuHubScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);

  return (
    <>
      <Stack.Screen options={{ title: 'Kuzu Ekle' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <Text style={[styles.lead, { color: colors.text }]}>Nasıl ekleyeceksiniz?</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Sahada hızlı yol — az yazı, büyük düğmeler. Sonra aşı / tartım / yem adımları hazırlanır.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tek kuzu ekle"
          onPress={() => router.push('/hayvan/hizli-ekle/tek' as never)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1 },
          ]}>
          <Text style={styles.cardTitle}>Tek kuzu</Text>
          <Text style={styles.cardBody}>Padok seç → küpe yaz → kaydet</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toplu kabul — çok kuzu"
          onPress={() => router.push('/hayvan/hizli-ekle/toplu' as never)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.tint,
              borderWidth: 2,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={[styles.cardTitle, { color: colors.tint }]}>Toplu kabul</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            10–100 kuzu · kaynak + padok · küpe aralığı · otomatik takvim
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/hayvan/ekle' as never)}
          style={{ marginTop: 20, paddingVertical: 14 }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700', textAlign: 'center' }}>
            Tüm alanlar (RFID / TÜRKVET) →
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  lead: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  card: {
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  cardBody: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', lineHeight: 20 },
});
