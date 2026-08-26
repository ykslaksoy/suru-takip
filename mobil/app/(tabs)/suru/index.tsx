import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { HayvanKarti } from '@/bilesenler/suru/HayvanKarti';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals, getAnimals, getLatestWeight, calculateADG } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { gradeFromAdg, type KuzuGrade } from '@/kaynak/kilo/kuzu-derece';

type Filter = 'all' | 'female' | 'male' | 'lamb';

export default function FlockScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, refresh, ready } = useDatabase();
  const { limit, tierLabel } = useSubscription();
  const [animals, setAnimals] = useState<(Animal & { latestWeight?: number | null; grade?: KuzuGrade })[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const list = await getAnimals({ search: search || undefined });
    let filtered = list;
    if (filter === 'female') filtered = list.filter((a) => a.sex === 'female');
    if (filter === 'male') filtered = list.filter((a) => a.sex === 'male');
    if (filter === 'lamb') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);
      filtered = list.filter((a) => new Date(a.birthDate) > cutoff);
    }
    const withWeights = await Promise.all(
      filtered.map(async (a) => {
        const latestWeight = await getLatestWeight(a.id);
        const adg = await calculateADG(a.id);
        const grade = gradeFromAdg(adg, {
          birthDate: a.birthDate,
          isSick: a.status === 'sick',
        });
        return { ...a, latestWeight, grade };
      })
    );
    setAnimals(withWeights);
    setTotal(await countAnimals());
  }, [search, filter]);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'female', label: 'Dişi' },
    { key: 'male', label: 'Erkek' },
    { key: 'lamb', label: 'Kuzu' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>SürüYön</Text>
          <Text style={{ color: colors.textSecondary }}>
            {total} hayvan · {tierLabel} ({total}/{limit})
          </Text>
        </View>
        <Link href="/hayvan/ekle" asChild>
          <Pressable style={[styles.addBtn, { backgroundColor: colors.tint }]}>
            <Text style={styles.addText}>+ Ekle</Text>
          </Pressable>
        </Link>
      </View>
      <TextInput
        placeholder="Küpe, isim veya TÜRKVET ara..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={[styles.search, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
      />
      <View style={styles.filters}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f.key ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}>
            <Text style={{ color: filter === f.key ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HayvanKarti animal={item} latestWeight={item.latestWeight} grade={item.grade} />
        )}
        contentContainerStyle={styles.list}
        onRefresh={() => {
          refresh();
          load();
        }}
        refreshing={false}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
            Henüz hayvan kaydı yok. + Ekle ile başlayın.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  title: { fontSize: 26, fontWeight: '800' },
  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  addText: { color: '#fff', fontWeight: '700' },
  search: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  list: { padding: 16, paddingBottom: 32 },
});
