import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAsiTakvimiDurumu, type AsiStokDurum } from '@/kaynak/saglik';

export function AsiTakvimi() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [list, setList] = useState<AsiStokDurum[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await getAsiTakvimiDurumu());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  if (loading) {
    return <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />;
  }

  if (list.length === 0) {
    return (
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24, paddingHorizontal: 16 }}>
        Yapılacak veya yaklaşan aşı yok. Program ve stok dengede.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Yapılacak aşılar ile stok dozu karşılaştırılır. Eksik varsa Bugün kartında da görünür.
      </Text>
      {list.map((d) => {
        const uyari = !d.stokYeterli || d.sktYakin;
        return (
          <View
            key={d.programId}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: uyari ? colors.danger : colors.border,
              },
            ]}>
            <Text style={[styles.title, { color: colors.text }]}>{d.asiAdi}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>
              Yapılacak: {d.yapilacakSayisi} · Yaklaşan: {d.yaklasanSayisi}
              {'\n'}
              Gerekli: {d.gerekenDoz} doz · Stok: {d.stokMiktar} {d.stokBirim}
              {d.stokAdi ? ` (${d.stokAdi})` : ' — stok kaydı yok'}
            </Text>
            {!d.stokYeterli ? (
              <Text style={[styles.flag, { color: colors.danger }]}>
                Eksik {d.eksikDoz} doz — stok tamamlanmalı
              </Text>
            ) : (
              <Text style={[styles.flag, { color: colors.success }]}>Stok yeterli</Text>
            )}
            {d.sktYakin ? (
              <Text style={[styles.flag, { color: colors.warning }]}>Son kullanma tarihi yaklaşıyor</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable onPress={() => router.push('/(tabs)/stok' as never)}>
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Stoka git →</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 32 },
  intro: { marginBottom: 12, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  title: { fontWeight: '800', fontSize: 16 },
  flag: { marginTop: 8, fontWeight: '700', fontSize: 13 },
  actions: { marginTop: 10 },
});
