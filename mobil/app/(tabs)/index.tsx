import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
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
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: colors.background }])}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={StyleSheet.flatten([
                styles.title,
                { color: colors.text, fontSize: dar ? 22 : 24 },
              ])}>
              SürüYön
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{aktifMod.baslik}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ayarlar"
              onPress={() => router.push('/(tabs)/ayarlar' as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.planBtn,
                  { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.88 : 1 },
                ])
              }>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Ayarlar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ana ekranı planla"
            onPress={() => router.push('/ana-sayfa/duzenle' as never)}
            style={({ pressed }) =>
              StyleSheet.flatten([
                styles.planBtn,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.88 : 1 },
              ])
            }>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Planla</Text>
            </Pressable>
          </View>
        </View>

        <BugunKarti />

        {!loading && hizliIslemler.length === 0 && kestirmeler.length === 0 ? (
          <View
            style={StyleSheet.flatten([
              styles.emptyBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ])}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Ana ekran boş. Planla ile kısayollarınızı seçin veya başlangıç düzenine dönün.
            </Text>
          </View>
        ) : null}

        {hizliGoster.length > 0 ? (
          <>
            <Text style={StyleSheet.flatten([styles.section, { color: colors.text }])}>Hızlı işlemler</Text>
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
  scroll: { paddingBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', gap: 6 },
  planBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
    justifyContent: 'center',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 14,
    marginBottom: 8,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  emptyBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
