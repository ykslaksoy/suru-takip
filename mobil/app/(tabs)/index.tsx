import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { HizliIslemlerGrid } from '@/bilesenler/ana-sayfa/HizliIslemlerGrid';
import { KestirmelerSatiri } from '@/bilesenler/ana-sayfa/KestirmelerSatiri';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';

export default function AnaSayfaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { pendingSync } = useDatabase();
  const { tierLabel } = useSubscription();

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>SürüYön</Text>
          <Text style={{ color: colors.textSecondary }}>{tierLabel} · Ağıl menüsü</Text>
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Hızlı işlemler</Text>
        <HizliIslemlerGrid />

        <KestirmelerSatiri />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { paddingBottom: 16 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800' },
  section: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
});
