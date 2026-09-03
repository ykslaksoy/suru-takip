import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { SEKME_IKONLARI, SEKME_IKONLARI_DOLU } from '@/bilesenler/ortak/SekmeIkonlari';

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
 * Modern alt dock — tek satır, vektör ikon, aktif yeşil hap.
 * Eski 3×3 emoji kutuları kaldırıldı.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const dar = width < 390;

  return (
    <View
      style={StyleSheet.flatten([
        styles.shell,
        {
          backgroundColor: scheme === 'dark' ? colors.card : '#fbfcf9',
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? 10 : 12,
        },
      ])}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = ETIKET[route.name] ?? options.tabBarLabel ?? options.title ?? route.name;
          const icon = focused
            ? (SEKME_IKONLARI_DOLU[route.name] ?? 'ellipse')
            : (SEKME_IKONLARI[route.name] ?? 'ellipse-outline');

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
                StyleSheet.flatten([styles.item, { opacity: pressed ? 0.7 : 1 }])
              }>
              <View
                style={StyleSheet.flatten([
                  styles.pill,
                  {
                    backgroundColor: focused ? colors.tint : 'transparent',
                    paddingHorizontal: dar ? 8 : 10,
                  },
                ])}>
                <Ionicons
                  name={icon}
                  size={dar ? 16 : 18}
                  color={focused ? '#fff' : colors.tabIconDefault}
                />
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
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 48,
  },
  pill: {
    minWidth: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.3,
  },
});
