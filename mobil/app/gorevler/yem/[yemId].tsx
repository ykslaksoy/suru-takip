import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getYemGorevDetay, type YemGorevDetay } from '@/kaynak/gorevler/yem-gorev';
import { gorevTarihMetni } from '@/kaynak/gorevler/liste';

export default function YemGorevDetayScreen() {
  const { yemId } = useLocalSearchParams<{ yemId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [detay, setDetay] = useState<YemGorevDetay | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!yemId) return;
    setLoading(true);
    try {
      setDetay(await getYemGorevDetay(yemId));
    } finally {
      setLoading(false);
    }
  }, [yemId]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey]),
  );

  const tarihTam = detay?.planlananAt
    ? gorevTarihMetni(detay.planlananAt, { yil: true })
    : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Yem görevi' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 32 }} />
        ) : !detay ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Bu yem kalemi için bekleyen kuzu bulunamadı.
          </Text>
        ) : (
          <>
            <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.baslik, { color: colors.text }]}>
                <Text style={{ color: colors.tint }}>{tarihTam ?? detay.gunBaslik}</Text>
                <Text style={{ color: colors.textSecondary }}> · </Text>
                {detay.koruma}
                {detay.urun ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '400' }}>
                    {' '}
                    ({detay.urun})
                  </Text>
                ) : null}
                <Text style={{ color: colors.textSecondary }}> · </Text>
                {detay.hayvanSayisi} kuzu
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 }}>
                {detay.gunBaslik} · aşı listesinden ayrı
              </Text>
            </View>

            <Text style={[styles.bolum, { color: colors.textSecondary }]}>
              Yem uygulanacak kuzular ({detay.hayvanSayisi})
            </Text>

            {detay.hayvanlar.map((h) => (
              <Pressable
                key={h.animalId}
                onPress={() => router.push(`/hayvan/${h.animalId}` as never)}
                style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{h.etiket}</Text>
                  {h.altEtiket ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      {h.altEtiket}
                    </Text>
                  ) : null}
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {h.paddock} · {h.planlananAt}
                  </Text>
                </View>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Rasyon →</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => router.push('/(tabs)/rasyon' as never)}
              style={[styles.cta, { backgroundColor: colors.tint }]}>
              <Text style={styles.ctaText}>Rasyon ekranına git →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 },
  baslik: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  bolum: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cta: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  ctaText: { color: '#fff', fontWeight: '800' },
});
