import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

const ETIKET: Record<string, string> = {
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

/**
 * Kompakt alt dock — 9 sekme tek satırda, eşit genişlik.
 * Eski 3×3 ızgara ~3 satır yer kaplıyordu; bu ~58px.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const dar = width < 380;

  return (
    <View
      style={StyleSheet.flatten([
        styles.shell,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? 8 : 10,
        },
      ])}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const emoji = options.tabBarEmoji ?? '•';
          const label = ETIKET[route.name] ?? options.tabBarLabel ?? options.title ?? route.name;

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
                StyleSheet.flatten([styles.item, { opacity: pressed ? 0.75 : 1 }])
              }>
              <View
                style={StyleSheet.flatten([
                  styles.iconWrap,
                  {
                    backgroundColor: focused ? colors.tint : scheme === 'dark' ? colors.border : '#eef5ee',
                  },
                ])}>
                <Text style={StyleSheet.flatten([styles.emoji, { fontSize: dar ? 13 : 14 }])}>
                  {emoji}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: focused ? colors.tint : colors.tabIconDefault,
                    fontSize: dar ? 9 : 10,
                    fontWeight: focused ? '800' : '600',
                  },
                ])}>
                {label}
              </Text>
              <View
                style={StyleSheet.flatten([
                  styles.dot,
                  { backgroundColor: focused ? colors.tint : 'transparent' },
                ])}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    minHeight: 52,
    gap: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    lineHeight: 18,
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
