import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { BugunKarti } from '@/bilesenler/ana-sayfa/BugunKarti';
import { HizliIslemlerGrid } from '@/bilesenler/ana-sayfa/HizliIslemlerGrid';
import { KestirmelerSatiri } from '@/bilesenler/ana-sayfa/KestirmelerSatiri';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useAnaSayfa } from '@/baglam/AnaSayfaBaglami';
import { useMod } from '@/baglam/ModBaglami';

export default function AnaSayfaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const { pendingSync } = useDatabase();
  const { hizliIslemler, kestirmeler, loading } = useAnaSayfa();
  const { aktifMod } = useMod();
  const dar = width < 360;

  const kestirmeGoster = kestirmeler.map((k) =>
    k.id === 'besi'
      ? { ...k, label: aktifMod.baslik, icon: aktifMod.icon, href: aktifMod.href ?? '/besi' }
      : k
  );
  const hizliGoster = hizliIslemler.map((k) =>
    k.id === 'besi'
      ? { ...k, label: aktifMod.baslik, icon: aktifMod.icon, href: aktifMod.href ?? '/besi' }
      : k
  );

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text, fontSize: dar ? 22 : 26 }]}>SürüYön</Text>
            <Text style={{ color: colors.textSecondary }}>{aktifMod.baslik}</Text>
          </View>
          <View style={styles.headerActions}>
            <Link href="/(tabs)/ayarlar" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ayarlar"
                style={({ pressed }) => [
                  styles.planBtn,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.88 : 1 },
                ]}>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Ayarlar</Text>
              </Pressable>
            </Link>
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
        </View>

        <BugunKarti />

        {!loading && hizliIslemler.length === 0 && kestirmeler.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Ana ekran boş. Planla ile kısayollarınızı seçin veya başlangıç düzenine dönün.
            </Text>
          </View>
        ) : null}

        {hizliGoster.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.text }]}>Hızlı işlemler</Text>
            <HizliIslemlerGrid items={hizliGoster} />
          </>
        ) : null}

        {kestirmeGoster.length > 0 ? <KestirmelerSatiri items={kestirmeGoster} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
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
