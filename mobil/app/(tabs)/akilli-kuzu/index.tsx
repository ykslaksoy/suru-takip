import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
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
          { key: 'beta', label: 'Beta' },
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

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {alt === 'oneriler' ? (
          <>
            <Text style={[styles.header, { color: colors.text }]}>Akıllı Kuzu</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Önerileri {AKILLI_KUZU.name} getirir · En üstte {SUPER_KUZU_BASARI.name}
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
          : cta.includes('Vet')
            ? '/(tabs)/veteriner'
            : '/(tabs)/suru';

  return (
    <Link href={href as never} asChild>
      <Pressable style={{ marginTop: 6, marginLeft: 54 }}>
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>{cta} →</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  sub: { paddingHorizontal: 16, marginBottom: 12 },
  hero: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroEmoji: { fontSize: 36 },
  heroName: { color: '#fff', fontWeight: '800', fontSize: 18 },
  heroTag: { color: '#ffffffcc', marginTop: 4, lineHeight: 18 },
  superCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  superTitle: { fontWeight: '800', fontSize: 18, textAlign: 'center', marginVertical: 8 },
  block: { marginBottom: 16 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 54 },
  tag: { fontWeight: '800', fontSize: 12 },
  bubbleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  bubble: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12 },
  bubbleName: { fontWeight: '800', fontSize: 12, marginBottom: 4 },
  bubbleText: { lineHeight: 20, fontSize: 14 },
});
