import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAyarlar } from '@/baglam/AyarlarBaglami';
import { AyarlarEkrani } from '@/bilesenler/ayarlar/AyarlarEkrani';

/** Ana sayfanın üstüne binen gerçek Ayarlar ekranı */
export function AyarlarKaplama() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { acik, kapat } = useAyarlar();

  if (!acik) return null;

  return (
    <View
      pointerEvents="auto"
      style={StyleSheet.flatten([
        styles.fill,
        {
          backgroundColor: colors.background,
          ...(Platform.OS === 'web' ? { zIndex: 9999 } : null),
        },
      ])}>
      <View
        style={StyleSheet.flatten([
          styles.topBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ])}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={10}
          onPress={kapat}
          style={({ pressed }) =>
            StyleSheet.flatten([styles.geriBtn, { opacity: pressed ? 0.7 : 1 }])
          }>
          <Ionicons name="chevron-back" size={22} color={colors.tint} />
          <Text style={StyleSheet.flatten([styles.geriText, { color: colors.tint }])}>Geri</Text>
        </Pressable>
        <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>Ayarlar</Text>
        <View style={styles.side} />
      </View>
      <AyarlarEkrani />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    elevation: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'web' ? 8 : 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  geriBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  geriText: { fontSize: 16, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  side: { minWidth: 72 },
});
