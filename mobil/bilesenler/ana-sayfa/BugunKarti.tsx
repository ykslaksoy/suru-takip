import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getBugunMaddeleri, type BugunMadde, type BugunSeviye } from '@/kaynak/ana-sayfa';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

function seviyeEtiket(s: BugunSeviye): string {
  if (s === 'uyari') return 'Uyarı';
  if (s === 'sira') return 'Sıra';
  return 'Bilgi';
}

function seviyeRenk(s: BugunSeviye, colors: (typeof Colors)['light']): string {
  if (s === 'uyari') return colors.danger;
  if (s === 'sira') return colors.warning;
  return colors.tint;
}

export function BugunKarti() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [maddeler, setMaddeler] = useState<BugunMadde[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMaddeler(await getBugunMaddeleri());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Bugün</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Günlük görevler</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tüm görevler"
          onPress={() => router.push('/gorevler' as never)}
          hitSlop={8}>
          <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>Tümü →</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginVertical: 12 }} />
      ) : (
        maddeler.map((m, index) => {
          const renk = seviyeRenk(m.seviye, colors);
          return (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={`${m.baslik}. ${m.aciklama}`}
              onPress={() => router.push(m.href as never)}
              style={({ pressed }) => [
                styles.row,
                index < maddeler.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={[styles.badge, { backgroundColor: renk + '22' }]}>
                <Text style={[styles.badgeText, { color: renk }]}>{seviyeEtiket(m.seviye)}</Text>
              </View>
              <View style={styles.body}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{m.baslik}</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {m.aciklama}
                </Text>
                <Text style={[styles.cta, { color: colors.tint }]}>{m.cta} →</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  body: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemDesc: { fontSize: 13, lineHeight: 18 },
  cta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
