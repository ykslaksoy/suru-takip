import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getTakviyeGorevDetay, type TakviyeGorevDetay } from '@/kaynak/gorevler/asi-gorev';
import { gorevTarihMetni } from '@/kaynak/gorevler/liste';
import { takviyeTipEtiket } from '@/kaynak/akilli-veteriner/mod-takviye';

function durumEtiket(h: TakviyeGorevDetay['hayvanlar'][0]): string {
  if (h.planlananAt && h.kalanGun != null && h.kalanGun > 0) {
    return `Plan: ${h.kalanGun} gün · ${gorevTarihMetni(h.planlananAt, { yil: true })}`;
  }
  if (h.durum === 'yaklasiyor' && h.kalanGun != null) return `${h.kalanGun} gün içinde`;
  return 'Yapılacak';
}

export default function AsiGorevDetayScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [detay, setDetay] = useState<TakviyeGorevDetay | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    try {
      setDetay(await getTakviyeGorevDetay(programId));
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey]),
  );

  const tarihTam = detay?.planlananAt
    ? gorevTarihMetni(detay.planlananAt, { yil: true })
    : detay
      ? gorevTarihMetni(new Date().toISOString().slice(0, 10), { yil: true })
      : null;

  const neYapilacak = detay
    ? detay.tip === 'tartim'
      ? detay.koruma
      : `${detay.koruma} (${detay.asiAdi}) ${detay.mlEtiket}`
    : '';

  const ekranBaslik =
    detay?.tip === 'tartim'
      ? 'Tartım görevi'
      : detay?.tip === 'vitamin'
        ? 'Vitamin görevi'
        : 'Aşı görevi';

  return (
    <>
      <Stack.Screen options={{ title: ekranBaslik }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 32 }} />
        ) : !detay ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Bu kalem için bekleyen kuzu bulunamadı.
          </Text>
        ) : (
          <>
            <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.baslik, { color: colors.text }]}>
                <Text style={{ color: colors.tint }}>{tarihTam ?? 'Tarih yok'}</Text>
                <Text style={{ color: colors.textSecondary }}> · </Text>
                {neYapilacak}
                <Text style={{ color: colors.textSecondary }}> · </Text>
                {detay.hayvanSayisi} kuzu
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 }}>
                {takviyeTipEtiket(detay.tip)} · {detay.mlEtiket}
              </Text>
            </View>

            <Text style={[styles.bolum, { color: colors.textSecondary }]}>
              Yapılacak kuzular ({detay.hayvanSayisi})
            </Text>

            {detay.hayvanlar.map((h) => (
              <Pressable
                key={h.animalId}
                onPress={() =>
                  router.push(
                    detay.tip === 'tartim'
                      ? `/hayvan/${h.animalId}/kilo`
                      : `/hayvan/${h.animalId}/saglik`,
                  )
                }
                style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{h.etiket}</Text>
                  {h.altEtiket ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      {h.altEtiket}
                    </Text>
                  ) : null}
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {h.paddock} · {durumEtiket(h)}
                  </Text>
                </View>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>
                  {detay.tip === 'tartim' ? 'Tartım →' : 'Kayıt →'}
                </Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => router.push('/(tabs)/veteriner')}
              style={[styles.cta, { backgroundColor: colors.tint }]}>
              <Text style={styles.ctaText}>Mod planından uygula →</Text>
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
