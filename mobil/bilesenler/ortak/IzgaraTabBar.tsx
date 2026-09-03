import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type TabRoute = { key: string; name: string; params?: object };

type IzgaraTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<
    string,
    { options: { title?: string; tabBarLabel?: string; tabBarEmoji?: string } }
  >;
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

const SABIT_ETIKET: Record<string, string> = {
  index: 'Ana',
  suru: 'Sürü',
  stok: 'Stok',
  saglik: 'Sağlık',
  rasyon: 'Rasyon',
  veteriner: 'Vet',
  'akilli-kuzu': 'Kuzu',
  yolculuk: 'Yol',
  ayarlar: 'Ayar',
};

/** Tek satır kaydırmalı alt menü — 3×3 ızgara ekranı yiyordu */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const dar = width < 360;

  return (
    <View
      style={StyleSheet.flatten([
        styles.bar,
        { backgroundColor: colors.card, borderTopColor: colors.border },
      ])}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const emoji = options.tabBarEmoji ?? '•';
          const label = SABIT_ETIKET[route.name] ?? options.tabBarLabel ?? options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.cell,
                  {
                    backgroundColor: focused ? colors.tint + '18' : 'transparent',
                    borderColor: focused ? colors.tint : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                    minWidth: dar ? 58 : 64,
                  },
                ])
              }>
              <Text style={styles.emoji}>{emoji}</Text>
              <Text
                numberOfLines={1}
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: focused ? colors.tint : colors.textSecondary,
                    fontSize: dar ? 10 : 11,
                  },
                ])}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    paddingBottom: 6,
  },
  row: {
    paddingHorizontal: 8,
    gap: 4,
    alignItems: 'center',
  },
  cell: {
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 52,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
});
