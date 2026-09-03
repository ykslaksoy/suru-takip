import { useCallback, useState } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
 * Dinamik alt dock — gerçek genişlik/yüksekliğe göre ikon ve etiket ölçekler.
 * Yatayda etiketler gizlenir, dokunma alanları esnek kalır.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width: winW, height: winH } = useWindowDimensions();
  const [barW, setBarW] = useState(winW);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setBarW(e.nativeEvent.layout.width);
  }, []);

  const yatay = winW > winH;
  const kisa = winH < 480 || yatay;
  const n = Math.max(1, state.routes.length);
  const itemW = barW / n;
  const cokDar = itemW < 48;
  const etiketGoster = !kisa && !cokDar && itemW >= 52;
  const iconSize = cokDar ? 15 : itemW < 64 ? 16 : 18;
  const pillH = kisa ? 26 : 28;
  const pillMinW = Math.min(40, Math.max(28, itemW - 8));

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.flatten([
        styles.shell,
        {
          backgroundColor: scheme === 'dark' ? colors.card : '#fbfcf9',
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? (kisa ? 4 : 8) : kisa ? 6 : 10,
          paddingTop: kisa ? 4 : 6,
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
                StyleSheet.flatten([
                  styles.item,
                  {
                    opacity: pressed ? 0.7 : 1,
                    minHeight: kisa ? 40 : 48,
                  },
                ])
              }>
              <View
                style={StyleSheet.flatten([
                  styles.pill,
                  {
                    backgroundColor: focused ? colors.tint : 'transparent',
                    minWidth: pillMinW,
                    height: pillH,
                    borderRadius: pillH / 2,
                  },
                ])}>
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={focused ? '#fff' : colors.tabIconDefault}
                />
              </View>
              {etiketGoster ? (
                <Text
                  numberOfLines={1}
                  style={StyleSheet.flatten([
                    styles.label,
                    {
                      color: focused ? colors.tint : colors.tabIconDefault,
                      fontSize: itemW < 70 ? 9 : 10,
                      fontWeight: focused ? '800' : '600',
                    },
                  ])}>
                  {label}
                </Text>
              ) : null}
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
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.3,
  },
});
