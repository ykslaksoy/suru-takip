import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

/** Kabul sonucu — açılabilir kartlar + sonraki adım rehberi */
export default function KabulSonucScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const params = useLocalSearchParams<{
    ids?: string;
    tags?: string;
    padok?: string;
    plan?: string;
    kupe?: string;
  }>();

  const ids = (params.ids ?? '').split(',').filter(Boolean);
  const tags = (params.tags ?? '').split(',').filter(Boolean);
  const padok = params.padok ?? '';
  const plan = params.plan ?? '';
  const kupe = params.kupe ?? '';

  const kartlar = ids.map((id, i) => ({
    id,
    earTag: tags[i] ?? id.slice(0, 8),
  }));

  const rehber = [
    {
      baslik: '1. Alım tartımı',
      aciklama: '1–2. gün — seri tartım',
      href: '/seri-giris',
    },
    {
      baslik: '2. Aşı / parazit',
      aciklama: 'Giriş koruma + Tarım Bakanlığı aşıları',
      href: '/(tabs)/veteriner',
    },
    {
      baslik: '3. Yem planı',
      aciklama: 'Kuzu besi rasyonu',
      href: '/(tabs)/rasyon',
    },
    {
      baslik: '4. Görevler',
      aciklama: 'Satışa kadar takvim',
      href: '/gorevler',
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Kabul tamam', headerBackVisible: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {kartlar.length} kuzu · {padok}
        </Text>
        {plan ? (
          <Text style={[styles.plan, { color: colors.textSecondary }]}>{plan}</Text>
        ) : null}
        {kupe ? (
          <Text style={[styles.plan, { color: colors.textSecondary }]}>{kupe}</Text>
        ) : null}

        <Text style={[styles.section, { color: colors.tint }]}>Kayıtlar — dokunarak aç</Text>
        <View style={styles.list}>
          {kartlar.slice(0, 80).map((k) => (
            <Pressable
              key={k.id}
              accessibilityRole="button"
              accessibilityLabel={`${k.earTag} detay`}
              onPress={() => router.push(`/hayvan/${k.id}` as never)}
              style={({ pressed }) => [
                styles.kart,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.kartTag, { color: colors.text }]}>{k.earTag}</Text>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>Aç →</Text>
            </Pressable>
          ))}
          {kartlar.length > 80 ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              +{kartlar.length - 80} kuzu daha — Sürü sekmesinden bakın
            </Text>
          ) : null}
        </View>

        <Text style={[styles.section, { color: colors.tint }]}>Sıradaki işler</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 10, lineHeight: 20 }}>
          Satışa kadar yönlendirme — büyük düğmeler.
        </Text>
        {rehber.map((r) => (
          <Pressable
            key={r.href}
            onPress={() => router.push(r.href as never)}
            style={[
              styles.rehber,
              { backgroundColor: colors.tint, marginBottom: 10 },
            ]}>
            <Text style={styles.rehberTitle}>{r.baslik}</Text>
            <Text style={styles.rehberBody}>{r.aciklama}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => router.replace('/(tabs)' as never)}
          style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>Ana Sayfa</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  plan: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '900', marginTop: 8, marginBottom: 10 },
  list: { gap: 8, marginBottom: 8 },
  kart: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  kartTag: { fontSize: 16, fontWeight: '800' },
  rehber: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  rehberTitle: { color: '#fff', fontWeight: '900', fontSize: 17, marginBottom: 4 },
  rehberBody: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 14 },
});
