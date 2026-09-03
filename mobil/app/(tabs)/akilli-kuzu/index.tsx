import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { clearAllData, seedDemoDataIfEmpty } from '@/kaynak/cekirdek/ornek-veri';
import {
  getSmartSuggestions,
  AKILLI_KUZU,
  SUPER_KUZU_BASARI,
  akilliKuzuGreeting,
  urgencyEtiket,
  type SmartSuggestion,
  type SuggestionUrgency,
} from '@/kaynak/akilli-kuzu/oneri';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

type Alt = 'oneriler' | 'abonelik' | 'turkvet' | 'beta' | 'daha';

function urgencyIcon(u: SuggestionUrgency): keyof typeof Ionicons.glyphMap {
  if (u === 'alert') return 'warning';
  if (u === 'action') return 'flash';
  return 'information-circle';
}

function OneriKarti({
  s,
  colors,
}: {
  s: SmartSuggestion;
  colors: (typeof Colors)['light'];
}) {
  const tone =
    s.urgency === 'alert' ? colors.danger : s.urgency === 'action' ? colors.warning : colors.tint;

  const href =
    s.cta?.includes('Stok')
      ? '/(tabs)/stok'
      : s.cta?.includes('Rasyon')
        ? '/(tabs)/rasyon'
        : s.cta?.includes('Aşı') || s.cta?.includes('Sağlık') || s.cta?.includes('Aşılama')
          ? '/(tabs)/saglik'
          : s.cta?.includes('Veteriner')
            ? '/(tabs)/veteriner'
            : s.cta?.includes('Karantina') || s.cta?.includes('Tartım')
              ? '/(tabs)/suru'
              : '/(tabs)/suru';

  return (
    <View
      style={StyleSheet.flatten([
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: tone,
        },
      ])}>
      <View style={styles.cardTop}>
        <View style={StyleSheet.flatten([styles.badge, { backgroundColor: tone + '18' }])}>
          <Ionicons name={urgencyIcon(s.urgency)} size={13} color={tone} />
          <Text style={StyleSheet.flatten([styles.badgeText, { color: tone }])}>
            {urgencyEtiket(s.urgency)}
          </Text>
        </View>
        <Text style={StyleSheet.flatten([styles.source, { color: colors.textSecondary }])}>
          {s.source === 'karantina'
            ? 'Karantina'
            : s.source === 'asi'
              ? 'Aşı'
              : s.source === 'tartim'
                ? 'Tartım'
                : s.source === 'rasyon'
                  ? 'Rasyon'
                  : s.source === 'stok'
                    ? 'Stok'
                    : s.source === 'saglik'
                      ? 'Sağlık'
                      : 'Genel'}
        </Text>
      </View>

      <Text style={StyleSheet.flatten([styles.cardTitle, { color: colors.text }])}>{s.title}</Text>
      <Text style={StyleSheet.flatten([styles.cardBody, { color: colors.text }])}>{s.body}</Text>
      <Text style={StyleSheet.flatten([styles.cardVoice, { color: colors.textSecondary }])}>
        {s.voice}
      </Text>

      {s.cta ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={s.cta}
          onPress={() => router.push(href as never)}
          style={({ pressed }) =>
            StyleSheet.flatten([
              styles.ctaBtn,
              {
                backgroundColor: tone + '14',
                borderColor: tone + '44',
                opacity: pressed ? 0.85 : 1,
              },
            ])
          }>
          <Text style={StyleSheet.flatten([styles.ctaText, { color: tone }])}>{s.cta}</Text>
          <Ionicons name="arrow-forward" size={14} color={tone} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function AkilliKuzuScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const { tierLabel, limit } = useSubscription();
  const [alt, setAlt] = useState<Alt>('oneriler');
  const greeting = useMemo(() => akilliKuzuGreeting(), []);
  const { scrollPadBottom } = useAltGuvenliBosluk();

  const suggestions = useMemo(
    () =>
      getSmartSuggestions({
        quarantineDay: 2,
        quarantineTotal: 5,
        needsVaccine: true,
        lowStock: true,
      }),
    []
  );

  const showSuperKuzu = false;
  const kritik = suggestions.filter((s) => s.urgency === 'alert').length;
  const aksiyon = suggestions.filter((s) => s.urgency === 'action').length;
  const bilgi = suggestions.filter((s) => s.urgency === 'info').length;

  return (
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: colors.background }])}>
      <AltButonlar
        items={[
          { key: 'oneriler', label: 'Öneriler' },
          { key: 'abonelik', label: 'Abonelik' },
          { key: 'turkvet', label: 'TÜRKVET' },
          { key: 'beta', label: 'Pilot' },
          { key: 'daha', label: 'Daha' },
        ]}
        activeKey={alt}
        onSelect={(k) => {
          const key = k as Alt;
          if (key === 'abonelik') {
            router.push('/abonelik');
            return;
          }
          if (key === 'turkvet') {
            router.push('/turkvet-aktar');
            return;
          }
          if (key === 'beta') {
            router.push('/beta');
            return;
          }
          setAlt(key);
        }}
      />

      <ScrollView
        contentContainerStyle={StyleSheet.flatten([
          styles.scroll,
          { paddingBottom: scrollPadBottom },
        ])}
        showsVerticalScrollIndicator={false}>
        {alt === 'oneriler' ? (
          <>
            <Text style={StyleSheet.flatten([styles.header, { color: colors.text }])}>
              Akıllı Kuzu
            </Text>
            <Text style={StyleSheet.flatten([styles.sub, { color: colors.textSecondary }])}>
              {AKILLI_KUZU.tagline}
            </Text>

            <View
              style={StyleSheet.flatten([
                styles.hero,
                { backgroundColor: colors.card, borderColor: colors.border },
              ])}>
              <View style={StyleSheet.flatten([styles.heroIcon, { backgroundColor: colors.tint + '18' }])}>
                <Ionicons name="analytics" size={20} color={colors.tint} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={StyleSheet.flatten([styles.heroName, { color: colors.text }])}>
                  Günlük değerlendirme
                </Text>
                <Text style={StyleSheet.flatten([styles.heroTag, { color: colors.textSecondary }])}>
                  {greeting}
                </Text>
              </View>
            </View>

            <View style={styles.ozetRow}>
              <View
                style={StyleSheet.flatten([
                  styles.ozetChip,
                  { backgroundColor: colors.danger + '14', borderColor: colors.danger + '33' },
                ])}>
                <Text style={StyleSheet.flatten([styles.ozetSayi, { color: colors.danger }])}>
                  {kritik}
                </Text>
                <Text style={StyleSheet.flatten([styles.ozetLabel, { color: colors.danger }])}>
                  Kritik
                </Text>
              </View>
              <View
                style={StyleSheet.flatten([
                  styles.ozetChip,
                  { backgroundColor: colors.warning + '14', borderColor: colors.warning + '33' },
                ])}>
                <Text style={StyleSheet.flatten([styles.ozetSayi, { color: colors.warning }])}>
                  {aksiyon}
                </Text>
                <Text style={StyleSheet.flatten([styles.ozetLabel, { color: colors.warning }])}>
                  Aksiyon
                </Text>
              </View>
              <View
                style={StyleSheet.flatten([
                  styles.ozetChip,
                  { backgroundColor: colors.tint + '14', borderColor: colors.tint + '33' },
                ])}>
                <Text style={StyleSheet.flatten([styles.ozetSayi, { color: colors.tint }])}>
                  {bilgi}
                </Text>
                <Text style={StyleSheet.flatten([styles.ozetLabel, { color: colors.tint }])}>
                  Bilgi
                </Text>
              </View>
            </View>

            {showSuperKuzu ? (
              <View
                style={StyleSheet.flatten([
                  styles.superCard,
                  { borderColor: colors.warning, backgroundColor: colors.card },
                ])}>
                <Text style={StyleSheet.flatten([styles.superTitle, { color: colors.text }])}>
                  {SUPER_KUZU_BASARI.title}
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                  {SUPER_KUZU_BASARI.desc}
                </Text>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {suggestions.map((s) => (
                <OneriKarti key={s.id} s={s} colors={colors} />
              ))}
            </View>
          </>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={StyleSheet.flatten([styles.header, { color: colors.text, paddingHorizontal: 0 }])}>
              Diğer
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Aktif paket: {tierLabel} · {limit} hayvan
            </Text>
            <AnaButon
              title="Demo veriyi yeniden yükle"
              variant="secondary"
              onPress={async () => {
                await clearAllData();
                await seedDemoDataIfEmpty();
                refresh();
                Alert.alert('Tamam', 'Demo veriler yüklendi.');
              }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { paddingTop: 4 },
  header: {
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 4,
    letterSpacing: -0.4,
  },
  sub: { paddingHorizontal: 16, marginBottom: 12, fontSize: 13, lineHeight: 18 },
  hero: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  heroTag: { marginTop: 3, lineHeight: 18, fontSize: 13 },
  ozetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  ozetChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ozetSayi: { fontSize: 18, fontWeight: '800' },
  ozetLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  superCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  superTitle: { fontWeight: '800', fontSize: 16, textAlign: 'center', marginBottom: 6 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.2 },
  source: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2, marginBottom: 4 },
  cardBody: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 6 },
  cardVoice: { fontSize: 13, lineHeight: 19 },
  ctaBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ctaText: { fontWeight: '800', fontSize: 13 },
});
