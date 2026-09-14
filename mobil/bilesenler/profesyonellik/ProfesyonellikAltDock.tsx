import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Stack ekranlarında kısa alt dock — Ana Sayfa + Görevler */
export function ProfesyonellikAltDock() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ana Sayfa"
        onPress={() => router.push('/(tabs)' as never)}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[styles.label, { color: colors.tint }]}>Ana Sayfa</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Görevler"
        onPress={() => router.push('/gorevler' as never)}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[styles.label, { color: colors.tint }]}>Görevler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '800' },
});
