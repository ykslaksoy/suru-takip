import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { useAyarlar } from '@/baglam/AyarlarBaglami';
import { DAHA_MENUSU } from '@/sabitler/HizliIslemler';

export default function DahaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk();
  const { ac: ayarlariAc } = useAyarlar();

  return (
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: scheme === 'light' ? '#fff' : colors.background }])}>
      <ScrollView
        contentContainerStyle={StyleSheet.flatten([styles.scroll, { paddingBottom: scrollPadBottom }])}
        showsVerticalScrollIndicator={false}>
        <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>Daha</Text>
        <Text style={StyleSheet.flatten([styles.sub, { color: colors.textSecondary }])}>
          Diğer ekranlar ve ayarlar
        </Text>
        <View style={styles.liste}>
          {DAHA_MENUSU.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                if (item.ayarlar) {
                  ayarlariAc();
                  return;
                }
                if (item.href) router.push(item.href as never);
              }}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.satir,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ])
              }>
              <Text style={StyleSheet.flatten([styles.satirText, { color: colors.text }])}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { paddingTop: 16, paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  liste: { gap: 8 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  satirText: { fontSize: 16, fontWeight: '700' },
});
