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
  type SmartSuggestion,
} from '@/kaynak/akilli-kuzu/oneri';

type Alt = 'oneriler' | 'abonelik' | 'turkvet' | 'beta' | 'daha';

function AkilliKuzuBubble({
  text,
  colors,
}: {
  text: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatar, { backgroundColor: colors.tint + '18' }]}>
        <Ionicons name="sparkles" size={18} color={colors.tint} />
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.bubbleName, { color: colors.tint }]}>{AKILLI_KUZU.name}</Text>
        <Text style={[styles.bubbleText, { color: colors.text }]}>{text}</Text>
      </View>
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

  const urgencyColor = (u: SmartSuggestion['urgency']) =>
    u === 'alert' ? colors.danger : u === 'action' ? colors.warning : colors.tint;

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {alt === 'oneriler' ? (
          <>
            <Text style={[styles.header, { color: colors.text }]}>Akıllı Kuzu</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Günlük öneriler · kritikler üstte
            </Text>

            <View style={[styles.hero, { backgroundColor: colors.tint }]}>
              <View style={styles.heroIcon}>
                <Ionicons name="sparkles" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{AKILLI_KUZU.name}</Text>
                <Text style={styles.heroTag}>{greeting}</Text>
              </View>
            </View>

            {showSuperKuzu ? (
              <View style={[styles.superCard, { borderColor: colors.warning, backgroundColor: colors.card }]}>
                <Text style={[styles.superTitle, { color: colors.text }]}>{SUPER_KUZU_BASARI.title}</Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                  {SUPER_KUZU_BASARI.desc}
                </Text>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 16 }}>
              {suggestions.map((s) => (
                <View key={s.id} style={styles.block}>
                  <View style={styles.tagRow}>
                    <View style={[styles.tagPill, { backgroundColor: urgencyColor(s.urgency) + '18' }]}>
                      <Text style={[styles.tag, { color: urgencyColor(s.urgency) }]}>
                        {s.urgency === 'alert' ? 'Önemli' : s.urgency === 'action' ? 'Şimdi' : 'İpucu'}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      {s.title}
                    </Text>
                  </View>
                  <AkilliKuzuBubble text={s.voice} colors={colors} />
                  {s.cta ? <CtaLink cta={s.cta} colors={colors} /> : null}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={[styles.header, { color: colors.text, paddingHorizontal: 0 }]}>Diğer</Text>
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

function CtaLink({ cta, colors }: { cta: string; colors: (typeof Colors)['light'] }) {
  const href =
    cta.includes('Stok')
      ? '/(tabs)/stok'
      : cta.includes('Rasyon')
        ? '/(tabs)/rasyon'
        : cta.includes('Aşı') || cta.includes('Sağlık')
          ? '/(tabs)/saglik'
          : cta.includes('Veteriner')
            ? '/(tabs)/veteriner'
            : '/(tabs)/suru';

  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={styles.cta}>
      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>{cta}</Text>
      <Ionicons name="arrow-forward" size={14} color={colors.tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 4, letterSpacing: -0.4 },
  sub: { paddingHorizontal: 16, marginBottom: 12, fontSize: 13 },
  hero: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: -0.3 },
  heroTag: { color: '#ffffffcc', marginTop: 3, lineHeight: 18, fontSize: 13 },
  superCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  superTitle: { fontWeight: '800', fontSize: 17, textAlign: 'center', marginBottom: 6 },
  block: { marginBottom: 14 },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 50,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tag: { fontWeight: '800', fontSize: 11 },
  bubbleRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  bubbleName: { fontWeight: '800', fontSize: 12, marginBottom: 4 },
  bubbleText: { lineHeight: 20, fontSize: 14 },
  cta: {
    marginTop: 6,
    marginLeft: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
