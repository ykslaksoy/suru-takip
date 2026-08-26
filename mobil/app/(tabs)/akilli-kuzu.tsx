import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/useRenkSemasi';
import {
  getSmartSuggestions,
  AKILLI_KUZU,
  SUPER_KUZU_BASARI,
  akilliKuzuGreeting,
  type SmartSuggestion,
} from '@/kaynak/akilli-kuzu';

function AkilliKuzuBubble({
  text,
  colors,
}: {
  text: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
        <Text style={styles.avatarEmoji}>{AKILLI_KUZU.emoji}</Text>
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

  // Demo: başarı kartı gizli; gerçek metrikte isSuperKuzuAchieved true olunca göster
  const showSuperKuzu = false;

  const urgencyColor = (u: SmartSuggestion['urgency']) =>
    u === 'alert' ? colors.danger : u === 'action' ? colors.warning : colors.tint;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.header, { color: colors.text }]}>Akıllı Kuzu</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Önerileri {AKILLI_KUZU.name} getirir · En üst verimde {SUPER_KUZU_BASARI.name}
      </Text>

      <View style={[styles.hero, { backgroundColor: colors.tint }]}>
        <Text style={styles.heroEmoji}>{AKILLI_KUZU.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroName}>{AKILLI_KUZU.name}</Text>
          <Text style={styles.heroTag}>{greeting}</Text>
        </View>
      </View>

      {showSuperKuzu ? (
        <View style={[styles.superCard, { borderColor: colors.warning, backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 32, textAlign: 'center' }}>{SUPER_KUZU_BASARI.emoji}</Text>
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
              <Text style={[styles.tag, { color: urgencyColor(s.urgency) }]}>
                {s.urgency === 'alert' ? 'Önemli' : s.urgency === 'action' ? 'Şimdi' : 'İpucu'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{s.title}</Text>
            </View>
            <AkilliKuzuBubble text={s.voice} colors={colors} />
            {s.cta ? <CtaLink cta={s.cta} colors={colors} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CtaLink({ cta, colors }: { cta: string; colors: (typeof Colors)['light'] }) {
  const href =
    cta.includes('Stok')
      ? '/(tabs)/stok'
      : cta.includes('Rasyon')
        ? '/rasyon'
        : cta.includes('Aşı') || cta.includes('Sağlık')
          ? '/(tabs)/saglik'
          : '/(tabs)/';

  return (
    <Link href={href as never} asChild>
      <Pressable style={{ marginTop: 6, marginLeft: 54 }}>
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>{cta} →</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  sub: { paddingHorizontal: 16, marginBottom: 12 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 36 },
  heroName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroTag: { color: '#ffffffcc', marginTop: 2, fontSize: 13 },
  superCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  superTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  block: { marginBottom: 18 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: 4 },
  tag: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  bubble: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    borderTopLeftRadius: 4,
  },
  bubbleName: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
});
