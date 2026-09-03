import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

export type AltButon = {
  key: string;
  label: string;
};

/** Modern segment kontrol — ince hap butonlar */
export function AltButonlar({
  items,
  activeKey,
  onSelect,
}: {
  items: AltButon[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={StyleSheet.flatten([styles.wrap, { backgroundColor: colors.background }])}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((item) => {
          const on = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.btn,
                  {
                    backgroundColor: on ? colors.tint : colors.card,
                    borderColor: on ? colors.tint : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ])
              }>
              <Text
                style={StyleSheet.flatten([
                  styles.label,
                  { color: on ? '#fff' : colors.textSecondary },
                ])}
                numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 8,
  },
  row: {
    paddingHorizontal: 14,
    gap: 6,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 34,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
