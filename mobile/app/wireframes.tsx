import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const WIREFRAMES = [
  {
    title: '1. Sürü Listesi',
    body: `┌─────────────────────────────┐
│ SürüYön          [+] [🔍]  │
│ 47 hayvan · 3 padok         │
├─────────────────────────────┤
│ [Tümü] [Dişi] [Erkek] [Kuzu]│
│ TR-34-001234  ♀ Merinos     │
│ Padok A · 68 kg · Sağlıklı  │
└─────────────────────────────┘`,
  },
  {
    title: '2. Hayvan Detay',
    body: `┌─────────────────────────────┐
│ ← TR-34-001234              │
│   🐑 Merinos · Dişi · 2 yaş   │
│ TÜRKVET: TR340012345678901   │
│ [📊 Kilo] [💊 Sağlık]       │
│ Son tartım: 68 kg           │
└─────────────────────────────┘`,
  },
  {
    title: '3. Kilo Takibi',
    body: `┌─────────────────────────────┐
│ ADG: +180 g/gün             │
│ [Tartım grafiği]            │
│ 12.08.2026  68.0 kg         │
│ [+ Yeni Tartım Ekle]        │
└─────────────────────────────┘`,
  },
  {
    title: '4. Hastalık / Tedavi',
    body: `┌─────────────────────────────┐
│ ⚠ Bekletme: 3 gün kaldı     │
│ 10.08 — İshal, tedavi       │
│ 01.07 — Clostridial aşı     │
│ [+ Yeni Kayıt]              │
└─────────────────────────────┘`,
  },
  {
    title: '5. Stok Takibi',
    body: `┌─────────────────────────────┐
│ [Yem] [Aşı] [İlaç]          │
│ ⚠ Arpa kırması — 120 kg     │
│ Clostridial aşı — 45 doz    │
│ [+ Stok Ekle]               │
└─────────────────────────────┘`,
  },
];

export default function WireframesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Faz 0 wireframe — 5 ana ekran. Detaylı dokümantasyon: docs/wireframes/ekran-tasarimlari.md
      </Text>
      {WIREFRAMES.map((w) => (
        <View key={w.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.tint }]}>{w.title}</Text>
          <Text style={[styles.mono, { color: colors.text }]}>{w.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  intro: { marginBottom: 16, lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  title: { fontWeight: '700', marginBottom: 10 },
  mono: { fontFamily: 'SpaceMono', fontSize: 11, lineHeight: 16 },
});
