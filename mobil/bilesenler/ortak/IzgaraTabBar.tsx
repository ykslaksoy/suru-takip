import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useMod } from '@/baglam/ModBaglami';

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

/** Alt navigasyon — 9 sekme, 3×3 ızgara */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktifMod } = useMod();

  const rows: TabRoute[][] = [];
  for (let i = 0; i < state.routes.length; i += 3) {
    rows.push(state.routes.slice(i, i + 3));
  }

  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {rows.map((row, rowIndex) => (
        <View key={`r-${rowIndex}`} style={styles.row}>
          {row.map((route) => {
            const index = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            let label = options.tabBarLabel ?? options.title ?? route.name;
            const emoji = options.tabBarEmoji ?? '•';

            if (route.name === 'yolculuk') {
              label = aktifMod.baslik.length <= 14 ? aktifMod.baslik : aktifMod.kisa;
            }

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
                style={({ pressed }) => [
                  styles.cell,
                  {
                    backgroundColor: focused ? colors.tint + '18' : 'transparent',
                    borderColor: focused ? colors.tint : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Text style={{ fontSize: focused ? 18 : 16 }}>
                  {route.name === 'yolculuk' ? aktifMod.icon : emoji}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.label, { color: focused ? colors.tint : colors.tabIconDefault }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, i) => (
                <View key={`sp-${rowIndex}-${i}`} style={styles.cell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
});
