import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { BugunKarti } from '@/bilesenler/ana-sayfa/BugunKarti';
import { HizliIslemlerGrid } from '@/bilesenler/ana-sayfa/HizliIslemlerGrid';
import { KestirmelerSatiri } from '@/bilesenler/ana-sayfa/KestirmelerSatiri';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useAnaSayfa } from '@/baglam/AnaSayfaBaglami';
import { useMod } from '@/baglam/ModBaglami';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

export default function AnaSayfaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { pendingSync } = useDatabase();
  const { hizliIslemler, kestirmeler, loading } = useAnaSayfa();
  const { aktifMod } = useMod();
  const { height } = useWindowDimensions();
  const { scrollPadBottom, kisa } = useAltGuvenliBosluk();

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

  // Ayarlar kestirmesini üste taşı — altta kesilmesin
  const kestirmeSirali = [...kestirmeGoster].sort((a, b) => {
    if (a.id === 'ayarlar') return -1;
    if (b.id === 'ayarlar') return 1;
    return 0;
  });

  return (
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: colors.background }])}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={StyleSheet.flatten([
          styles.scrollContent,
          { paddingBottom: scrollPadBottom, minHeight: Math.max(height * 0.55, 280) },
        ])}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={StyleSheet.flatten([styles.header, { paddingTop: kisa ? 2 : 4 }])}>
          <View style={styles.brand}>
            <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])} numberOfLines={1}>
              SürüYön
            </Text>
            <Text
              style={StyleSheet.flatten([styles.sub, { color: colors.textSecondary }])}
              numberOfLines={1}>
              {aktifMod.baslik}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ayarlar"
              onPress={() => router.push('/(tabs)/ayarlar' as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.ayarlarBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.tint,
                    opacity: pressed ? 0.85 : 1,
                  },
                ])
              }>
              <Ionicons name="settings-outline" size={16} color={colors.tint} />
              <Text style={StyleSheet.flatten([styles.ayarlarText, { color: colors.tint }])}>
                Ayarlar
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ana ekranı planla"
              onPress={() => router.push('/ana-sayfa/duzenle' as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.iconBtn,
                  {
                    backgroundColor: colors.tint,
                    borderColor: colors.tint,
                    opacity: pressed ? 0.9 : 1,
                  },
                ])
              }>
              <Ionicons name="grid-outline" size={18} color="#fff" />
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
              Ana ekran boş. Sağ üstteki düzenle ile kısayol ekleyin.
            </Text>
          </View>
        ) : null}

        {hizliGoster.length > 0 ? (
          <>
            <Text style={StyleSheet.flatten([styles.section, { color: colors.text }])}>
              Hızlı işlemler
            </Text>
            <HizliIslemlerGrid items={hizliGoster} />
          </>
        ) : null}

        {kestirmeSirali.length > 0 ? <KestirmelerSatiri items={kestirmeSirali} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 8,
  },
  brand: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  ayarlarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ayarlarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 14,
    marginBottom: 8,
    marginTop: 4,
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
