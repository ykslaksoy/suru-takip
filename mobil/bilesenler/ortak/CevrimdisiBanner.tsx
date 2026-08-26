import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

export function CevrimdisiBanner({ pendingSync }: { pendingSync: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.banner, { backgroundColor: colors.accent }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {pendingSync > 0
          ? `Çevrimdışı mod · ${pendingSync} kayıt senkron bekliyor`
          : 'Çevrimdışı çalışır · İnternet gelince otomatik senkron'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
