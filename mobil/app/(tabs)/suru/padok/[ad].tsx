import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { HayvanKarti } from '@/bilesenler/suru/HayvanKarti';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals, getLatestWeight, calculateADG } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { gradeFromAdg, type KuzuGrade } from '@/kaynak/kilo/kuzu-derece';

/** Besi: sadece cinsiyet */
type Filter = 'all' | 'male' | 'female';
type HayvanSatir = Animal & { latestWeight?: number | null; grade?: KuzuGrade };

/**
 * Padok hayvanları — ayrı tam sayfa (inline alt şerit değil).
 * Geri + alt sekme çubuğu ile saha kullanımı.
 */
export default function PadokHayvanlariScreen() {
  const params = useLocalSearchParams<{ ad?: string | string[] }>();
  const padokAd = useMemo(() => {
    const raw = params.ad;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return (v ?? '').trim();
  }, [params.ad]);

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, refresh, ready } = useDatabase();
  const [animals, setAnimals] = useState<HayvanSatir[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    if (!padokAd) {
      setAnimals([]);
      return;
    }
    const list = await getAnimals({ search: search || undefined });
    const hedef = padokAd.toLocaleLowerCase('tr');
    let filtered = list.filter((a) => (a.paddock || '').trim().toLocaleLowerCase('tr') === hedef);
    if (filter === 'female') filtered = filtered.filter((a) => a.sex === 'female');
    if (filter === 'male') filtered = filtered.filter((a) => a.sex === 'male');
    const withWeights = await Promise.all(
      filtered.map(async (a) => {
        const latestWeight = await getLatestWeight(a.id);
        const adg = await calculateADG(a.id);
        const grade = gradeFromAdg(adg, {
          birthDate: a.birthDate,
          isSick: a.status === 'sick',
        });
        return { ...a, latestWeight, grade };
      }),
    );
    setAnimals(withWeights);
  }, [padokAd, search, filter]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, refreshKey, load]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'male', label: 'Erkek' },
    { key: 'female', label: 'Dişi' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: padokAd || 'Padok',
          headerBackTitle: 'Sürü',
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <CevrimdisiBanner pendingSync={pendingSync} />
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])} numberOfLines={1}>
              {padokAd || 'Padok'}
            </Text>
            <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
              {animals.length} hayvan
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bu padoka hayvan ekle"
            onPress={() =>
              router.push({
                pathname: '/hayvan/hizli-ekle/tek-form',
                params: { padok: padokAd },
              } as never)
            }
            style={StyleSheet.flatten([styles.addBtn, { backgroundColor: colors.tint }])}>
            <Text style={styles.addText}>+ Ekle</Text>
          </Pressable>
        </View>

        <AltButonlar
          items={filters.map((f) => ({ key: f.key, label: f.label }))}
          activeKey={filter}
          onSelect={(k) => setFilter(k as Filter)}
        />
        <TextInput
          placeholder="Küpe, sırt no, Aref veya TÜRKVET ara..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={StyleSheet.flatten([
            styles.search,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ])}
        />
        <FlatList
          data={animals}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <HayvanKarti animal={item} latestWeight={item.latestWeight} grade={item.grade} />
          )}
          contentContainerStyle={styles.list}
          onRefresh={() => {
            refresh();
            void load();
          }}
          refreshing={false}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: 'center',
                color: colors.textSecondary,
                marginTop: 24,
                paddingHorizontal: 16,
              }}>
              {padokAd
                ? `${padokAd} içinde hayvan yok. + ile ekleyin.`
                : 'Geçersiz padok.'}
            </Text>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  search: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 48,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
});
