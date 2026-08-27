import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { BugunKarti } from '@/bilesenler/ana-sayfa/BugunKarti';
import { HizliIslemlerGrid } from '@/bilesenler/ana-sayfa/HizliIslemlerGrid';
import { KestirmelerSatiri } from '@/bilesenler/ana-sayfa/KestirmelerSatiri';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { useAnaSayfa } from '@/baglam/AnaSayfaBaglami';

export default function AnaSayfaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const { pendingSync } = useDatabase();
  const { tierLabel } = useSubscription();
  const { hizliIslemler, kestirmeler, loading } = useAnaSayfa();
  const dar = width < 360;

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text, fontSize: dar ? 22 : 26 }]}>SürüYön</Text>
            <Text style={{ color: colors.textSecondary }}>{tierLabel} · Ağıl menüsü</Text>
          </View>
          <Link href="/ana-sayfa/duzenle" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ana ekranı planla"
              style={({ pressed }) => [
                styles.planBtn,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.88 : 1 },
              ]}>
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Planla</Text>
            </Pressable>
          </Link>
        </View>

        <BugunKarti />

        {!loading && hizliIslemler.length === 0 && kestirmeler.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Ana ekran boş. Planla ile kısayollarınızı seçin veya başlangıç düzenine dönün.
            </Text>
          </View>
        ) : null}

        {hizliIslemler.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.text }]}>Hızlı işlemler</Text>
            <HizliIslemlerGrid items={hizliIslemler} />
          </>
        ) : null}

        {kestirmeler.length > 0 ? <KestirmelerSatiri items={kestirmeler} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '800' },
  planBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
