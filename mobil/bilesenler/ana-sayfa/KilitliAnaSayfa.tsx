import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { KilitliHizliIslemler } from '@/bilesenler/ana-sayfa/KilitliHizliIslemler';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import {
  getAnaSayfaOzeti,
  KILITLI_ANA_BASLIK,
  KILITLI_SEZON_ETIKET,
  type AnaSayfaOzet,
  type AnaSayfaPartiTon,
} from '@/kaynak/ana-sayfa/ozet';
import { KILITLI_MASKOT } from '@/kaynak/ana-sayfa/kilitli-gorseller';

const PADOK_TON: Record<AnaSayfaPartiTon, { bg: string; fg: string }> = {
  a: { bg: '#E8F1FF', fg: '#2F80ED' },
  b: { bg: '#E8F8EE', fg: '#219653' },
  c: { bg: '#FFF4E5', fg: '#F2994A' },
};

const BOS_OZET: AnaSayfaOzet = {
  hayvanSayisi: 0,
  gorevSayisi: 0,
  partiler: [],
  kritik: 0,
  aksiyon: 0,
};

export function KilitliAnaSayfa() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { pendingSync, ready, refreshKey } = useDatabase();
  const { height, width } = useWindowDimensions();
  const { scrollPadBottom, headerPadTop, kisa, darTelefon } = useAltGuvenliBosluk(88);
  const [ozet, setOzet] = useState<AnaSayfaOzet>(BOS_OZET);
  const light = scheme === 'light';
  const bg = light ? '#ffffff' : colors.background;
  const maskotBoy = kisa ? 72 : darTelefon ? 88 : 108;

  const load = useCallback(async () => {
    setOzet(await getAnaSayfaOzeti());
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, refreshKey, load]);

  return (
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: bg }])}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={StyleSheet.flatten([
          styles.scrollContent,
          {
            paddingBottom: scrollPadBottom,
            // Kısa telefonda içeriği sıkıştırma — scroll ile Hızlı İşlemler açılsın
            minHeight: Math.max(height * 0.45, 240),
          },
        ])}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <View
          style={StyleSheet.flatten([
            styles.header,
            { paddingTop: headerPadTop, paddingHorizontal: darTelefon ? 14 : 16 },
          ])}>
          <View
            style={StyleSheet.flatten([
              styles.maskotWrap,
              { width: maskotBoy, height: maskotBoy },
            ])}>
            <Image
              source={KILITLI_MASKOT}
              style={StyleSheet.flatten([styles.maskot, { width: maskotBoy, height: maskotBoy }])}
              resizeMode="contain"
              accessibilityLabel="Akıllı Kuzu"
            />
          </View>
          <View style={styles.headerMetin}>
            <Text
              style={StyleSheet.flatten([
                styles.title,
                { color: colors.text, fontSize: width < 360 ? 22 : 26 },
              ])}>
              {KILITLI_ANA_BASLIK}
            </Text>
            <Text style={StyleSheet.flatten([styles.sub, { color: colors.textSecondary }])}>
              {KILITLI_SEZON_ETIKET}
            </Text>
          </View>
        </View>

        <View style={styles.metrikRow}>
          <MetrikKart
            icon="cloud"
            iconColor="#2F80ED"
            iconBg="#E8F1FF"
            sayi={`${ozet.hayvanSayisi}`}
            birim="Baş"
            alt="Tüm Kuzular"
            colors={colors}
            light={light}
            onPress={() => router.push('/(tabs)/suru' as never)}
          />
          <MetrikKart
            icon="checkmark-circle"
            iconColor="#219653"
            iconBg="#E8F8EE"
            sayi={`${ozet.gorevSayisi}`}
            birim="Görev"
            alt="Bugün"
            colors={colors}
            light={light}
            onPress={() => router.push('/gorevler' as never)}
          />
        </View>

        <View style={styles.bolumBaslik}>
          <Text style={StyleSheet.flatten([styles.bolum, { color: colors.text }])}>Aktif Partiler</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tüm partileri gör"
            onPress={() => router.push('/(tabs)/suru' as never)}
            hitSlop={8}>
            <Text style={StyleSheet.flatten([styles.link, { color: colors.tint }])}>Tüm partileri gör ›</Text>
          </Pressable>
        </View>

        <View style={StyleSheet.flatten([styles.partiRow, { paddingHorizontal: darTelefon ? 14 : 18 }])}>
          {ozet.partiler.map((p) => {
            const ton = PADOK_TON[p.ton];
            return (
              <Pressable
                key={p.ad}
                accessibilityRole="button"
                accessibilityLabel={`${p.ad}, ${p.bas} baş, ${p.yasEtiket}`}
                onPress={() => router.push('/(tabs)/suru' as never)}
                style={({ pressed }) =>
                  StyleSheet.flatten([
                    styles.partiKart,
                    { backgroundColor: light ? ton.bg : colors.card, opacity: pressed ? 0.88 : 1 },
                  ])
                }>
                <View style={StyleSheet.flatten([styles.harf, { backgroundColor: light ? '#fff' : ton.fg + '22' }])}>
                  <Text style={StyleSheet.flatten([styles.harfText, { color: ton.fg }])}>{p.harf}</Text>
                </View>
                <Text
                  style={StyleSheet.flatten([styles.partiAd, { color: colors.text }])}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}>
                  {p.ad}
                </Text>
                <Text style={StyleSheet.flatten([styles.partiBas, { color: colors.text }])}>{p.bas} Baş</Text>
                <Text
                  style={StyleSheet.flatten([styles.partiYas, { color: colors.textSecondary }])}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}>
                  {p.yasEtiket}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={StyleSheet.flatten([styles.bolum, styles.bolumPad, { color: colors.text }])}>Akıllı Kuzu</Text>
        <View style={styles.akilliRow}>
          <OzetSayiKart
            etiket="Kritik"
            sayi={ozet.kritik}
            bg={light ? '#FDECEC' : colors.card}
            fg="#C0392B"
            colors={colors}
            onPress={() => router.push('/(tabs)/akilli-kuzu' as never)}
          />
          <OzetSayiKart
            etiket="Aksiyon"
            sayi={ozet.aksiyon}
            bg={light ? '#FFF4E5' : colors.card}
            fg="#D68910"
            colors={colors}
            onPress={() => router.push('/(tabs)/akilli-kuzu' as never)}
          />
        </View>

        <Text style={StyleSheet.flatten([styles.bolum, styles.bolumPad, { color: colors.text }])}>Hızlı İşlemler</Text>
        <KilitliHizliIslemler />
        {/* Alt dock üstünde net boşluk — son sıra etiketleri kesilmesin */}
        <View style={{ height: darTelefon ? 12 : 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </ScrollView>
    </View>
  );
}

function MetrikKart({
  icon,
  iconColor,
  iconBg,
  sayi,
  birim,
  alt,
  colors,
  light,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  sayi: string;
  birim: string;
  alt: string;
  colors: (typeof Colors)['light'];
  light: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sayi} ${birim}, ${alt}`}
      onPress={onPress}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.metrikKart,
          {
            backgroundColor: light ? '#fff' : colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ])
      }>
      <View style={StyleSheet.flatten([styles.metrikIcon, { backgroundColor: light ? iconBg : iconColor + '22' }])}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={StyleSheet.flatten([styles.metrikSayi, { color: colors.text }])}>
          {sayi} {birim}
        </Text>
        <Text style={StyleSheet.flatten([styles.metrikAlt, { color: colors.textSecondary }])}>{alt}</Text>
      </View>
    </Pressable>
  );
}

function OzetSayiKart({
  etiket,
  sayi,
  bg,
  fg,
  colors,
  onPress,
}: {
  etiket: string;
  sayi: number;
  bg: string;
  fg: string;
  colors: (typeof Colors)['light'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etiket} ${sayi}`}
      onPress={onPress}
      style={({ pressed }) =>
        StyleSheet.flatten([styles.ozetKart, { backgroundColor: bg, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }])
      }>
      <Text style={StyleSheet.flatten([styles.ozetEtiket, { color: fg }])}>{etiket}</Text>
      <Text style={StyleSheet.flatten([styles.ozetSayi, { color: fg }])}>{sayi}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    overflow: 'visible',
  },
  maskotWrap: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  maskot: {
    width: 108,
    height: 108,
    maxWidth: '100%',
    maxHeight: '100%',
    // RN Web: cover varsayılanı bacakları kesebiliyordu
    ...({ objectFit: 'contain' } as object),
  },
  headerMetin: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 4,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' },
  sub: { fontSize: 14, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  metrikRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 18 },
  metrikKart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metrikIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metrikSayi: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  metrikAlt: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  bolumBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  bolum: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  bolumPad: { paddingHorizontal: 16, marginBottom: 10, marginTop: 6 },
  link: { fontSize: 13, fontWeight: '700' },
  partiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  partiKart: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    minWidth: 0,
  },
  harf: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  harfText: { fontSize: 14, fontWeight: '800' },
  partiAd: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  partiBas: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  partiYas: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  akilliRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 18 },
  ozetKart: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ozetEtiket: { fontSize: 14, fontWeight: '700' },
  ozetSayi: { fontSize: 32, fontWeight: '800', marginTop: 2, letterSpacing: -1 },
});
