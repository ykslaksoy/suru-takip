import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AsiKatalogOzetKarti } from '@/bilesenler/saglik/AsiKatalogOzetKarti';
import { getTakviyeKatalogOzeti, type TakviyeKatalogOzeti } from '@/kaynak/saglik/asi-katalog';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

export default function AsiKatalogDetayScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [ozet, setOzet] = useState<TakviyeKatalogOzeti | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    try {
      setOzet(await getTakviyeKatalogOzeti(programId));
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, refreshKey, load]);

  const baslik = ozet ? `${ozet.urunAdi} · katalog` : 'Aşı katalog';

  return (
    <>
      <Stack.Screen options={{ title: baslik }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 32 }} />
        ) : !ozet ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Bu kalem katalogda bulunamadı.
          </Text>
        ) : (
          <>
            <AsiKatalogOzetKarti ozet={ozet} />
            <View style={[styles.aksiyonlar, { borderColor: colors.border }]}>
              <Pressable
                onPress={() => router.push(`/gorevler/asi/${ozet.programId}` as never)}
                style={[styles.btn, { backgroundColor: colors.tint }]}>
                <Text style={styles.btnText}>Bekleyen kuzular / görev →</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/gorevler/asi' as never)} style={styles.link}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>← Aşı ve İlaç planı</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/stok' as never)} style={styles.link}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>Stok kayıtları →</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 32 },
  aksiyonlar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 12 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  link: { paddingVertical: 4 },
});
