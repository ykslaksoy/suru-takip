import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

/** Kısa sabit etiket — uzun mod adı ızgarayı bozmasın */
const SABIT_ETIKET: Record<string, string> = {
  index: 'Ana',
  suru: 'Sürü',
  stok: 'Stok',
  saglik: 'Sağlık',
  rasyon: 'Rasyon',
  veteriner: 'Veteriner',
  'akilli-kuzu': 'Kuzu',
  yolculuk: 'Yolculuk',
  ayarlar: 'Ayarlar',
};

/** Alt navigasyon — 9 sekme, eşit 3×3 ızgara */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const dar = width < 360;

  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={styles.grid}>
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
            <View key={route.key} style={styles.cellWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.cell,
                  {
                    backgroundColor: focused ? colors.tint + '18' : colors.background,
                    borderColor: focused ? colors.tint : colors.border,
                    opacity: pressed ? 0.85 : 1,
                    minHeight: dar ? 56 : 60,
                  },
                ]}>
                <Text style={styles.emoji}>{emoji}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: focused ? colors.tint : colors.textSecondary,
                      fontSize: dar ? 10 : 11,
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrap: {
    width: '33.333%',
    padding: 3,
  },
  cell: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 4,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
});
