import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { GorevSatiri } from '@/bilesenler/gorevler/GorevSatiri';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  GOREV_KATEGORI_SIRASI,
  getGorevGruplari,
  setPlanlananTamam,
  setIsPlaniTamam,
  type GorevGrup,
  type GorevKategoriId,
} from '@/kaynak/gorevler';

async function gorevTamamla(id: string): Promise<void> {
  if (id.startsWith('is-plani-')) {
    await setIsPlaniTamam(id.replace(/^is-plani-/, ''), true);
  } else if (id.startsWith('plan-')) {
    await setPlanlananTamam(id.replace(/^plan-/, ''), true);
  }
}

function isKategoriId(v: string | undefined): v is GorevKategoriId {
  return GOREV_KATEGORI_SIRASI.some((k) => k.id === v);
}

export default function GorevKategoriScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [grup, setGrup] = useState<GorevGrup | null>(null);
  const [loading, setLoading] = useState(true);

  const meta = isKategoriId(id) ? GOREV_KATEGORI_SIRASI.find((k) => k.id === id)! : null;

  const load = useCallback(async () => {
    if (!isKategoriId(id)) {
      setGrup(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { gruplar } = await getGorevGruplari();
      setGrup(gruplar.find((g) => g.id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  const tamamlaVeYenile = async (gorevId: string) => {
    await gorevTamamla(gorevId);
    await load();
  };

  const baslik = meta ? `${meta.icon} ${meta.label}` : 'Kategori';

  return (
    <>
      <Stack.Screen options={{ title: meta?.label ?? 'Kategori' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 32 }} />
        ) : !meta ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Geçersiz kategori.
          </Text>
        ) : !grup || grup.gorevler.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Bu kategoride bekleyen görev yok.
          </Text>
        ) : (
          <View style={[styles.detay, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <View style={styles.detayBaslik}>
              <Text style={[styles.detayTitle, { color: colors.text }]}>{baslik}</Text>
              <Text style={{ color: colors.textSecondary }}>{grup.adet} görev</Text>
            </View>
            {grup.gorevler.map((g) => (
              <GorevSatiri
                key={g.id}
                g={g}
                colors={colors}
                onTamamla={g.tamamlanabilir ? () => tamamlaVeYenile(g.id) : undefined}
              />
            ))}
            <Pressable onPress={() => router.push(grup.href as never)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>
                {grup.label} ekranına git →
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  detay: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  detayBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detayTitle: { fontSize: 17, fontWeight: '800' },
});
