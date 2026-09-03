import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { HayvanKarti } from '@/bilesenler/suru/HayvanKarti';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { PadokYonetimiPaneli } from '@/bilesenler/suru/PadokYonetimiPaneli';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals, getAnimals, getLatestWeight, calculateADG } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { gradeFromAdg, type KuzuGrade } from '@/kaynak/kilo/kuzu-derece';

type Filter = 'all' | 'female' | 'male' | 'lamb';
type HayvanSatir = Animal & { latestWeight?: number | null; grade?: KuzuGrade };

export default function FlockScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, refresh, ready } = useDatabase();
  const { limit, tierLabel } = useSubscription();
  const [animals, setAnimals] = useState<HayvanSatir[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [padokFiltre, setPadokFiltre] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const listeRef = useRef<FlatList<HayvanSatir>>(null);

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
    if (padokFiltre) {
      const hedef = padokFiltre.trim().toLocaleLowerCase('tr');
      filtered = filtered.filter((a) => (a.paddock || '').trim().toLocaleLowerCase('tr') === hedef);
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
      }),
    );
    setAnimals(withWeights);
    setTotal(await countAnimals());
  }, [search, filter, padokFiltre]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, refreshKey, load]);

  useEffect(() => {
    if (padokFiltre) {
      // Padok seçilince hayvan listesine kaydır
      requestAnimationFrame(() => {
        listeRef.current?.scrollToOffset({ offset: 220, animated: true });
      });
    }
  }, [padokFiltre]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'female', label: 'Dişi' },
    { key: 'male', label: 'Erkek' },
    { key: 'lamb', label: 'Kuzu' },
  ];

  const limitYazi = limit === Number.POSITIVE_INFINITY ? '∞' : String(limit);

  const baslikAlt = useMemo(() => {
    if (padokFiltre) {
      return `${padokFiltre} · ${animals.length} hayvan`;
    }
    return `${total} hayvan · ${tierLabel} (${total}/${limitYazi})`;
  }, [padokFiltre, animals.length, total, tierLabel, limitYazi]);

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>SürüYön</Text>
          <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
            {baslikAlt}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hayvan ekle"
          onPress={() =>
            router.push(
              padokFiltre
                ? ({ pathname: '/hayvan/ekle', params: { padok: padokFiltre } } as never)
                : ('/hayvan/ekle' as never),
            )
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
        ref={listeRef}
        data={animals}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <PadokYonetimiPaneli seciliPadok={padokFiltre} onPadokSec={setPadokFiltre} />
        }
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
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 24, paddingHorizontal: 16 }}>
            {padokFiltre
              ? `${padokFiltre} içinde hayvan yok. + ile ekleyin.`
              : 'Henüz hayvan kaydı yok. Padok satırına dokunup Giriş veya + Ekle ile başlayın.'}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontWeight: '700' },
  search: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
});
