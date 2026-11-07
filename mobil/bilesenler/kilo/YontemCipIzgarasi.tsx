/** Tartım ekranı — sarılabilir yöntem çipleri (kesilme yok, min 44px dokunma) */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

export function YontemCipIzgarasi({
  items,
  activeKey,
  onSelect,
}: {
  items: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.sarma}>
      {items.map((item) => {
        const on = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(item.key)}
            style={({ pressed }) => [
              styles.cip,
              {
                backgroundColor: on ? colors.tint : colors.card,
                borderColor: on ? colors.tint : colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <Text style={[styles.etiket, { color: on ? '#fff' : colors.text }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sarma: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  cip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  etiket: {
    fontSize: 14,
    fontWeight: '800',
  },
});
