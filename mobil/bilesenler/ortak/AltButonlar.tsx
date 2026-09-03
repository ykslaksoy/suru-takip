import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

export type AltButon = {
  key: string;
  label: string;
};

/** Sekme içi küçük alt butonlar (yatay kaydırılabilir) */
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
    <View style={StyleSheet.flatten([styles.wrap, { borderBottomColor: colors.border }])}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const on = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={StyleSheet.flatten([
                styles.btn,
                {
                  backgroundColor: on ? colors.tint : colors.card,
                  borderColor: on ? colors.tint : colors.border,
                },
              ])}>
              <Text
                style={StyleSheet.flatten([styles.label, { color: on ? '#fff' : colors.text }])}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
