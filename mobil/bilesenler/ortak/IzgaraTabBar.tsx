import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SekmeIkonAdi } from '@/bilesenler/ortak/SekmeIkonlari';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { SEKME_IKONLARI, SEKME_IKONLARI_DOLU } from '@/bilesenler/ortak/SekmeIkonlari';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

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
  ayarlar: 'Ayarlar',
};

type TabItemProps = {
  route: TabRoute;
  focused: boolean;
  label: string;
  icon: SekmeIkonAdi;
  colors: (typeof Colors)['light'];
  kisa: boolean;
  minW: number;
  iconSize: number;
  showLabel: boolean;
  onPress: () => void;
};

function TabItem({
  route,
  focused,
  label,
  icon,
  colors,
  kisa,
  minW,
  iconSize,
  showLabel,
  onPress,
}: TabItemProps) {
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
            minHeight: kisa ? 42 : 48,
            minWidth: minW,
          },
        ])
      }>
      <View
        style={StyleSheet.flatten([
          styles.pill,
          {
            backgroundColor: focused ? colors.tint : 'transparent',
            minWidth: Math.min(44, Math.max(30, minW - 4)),
            height: kisa ? 28 : 30,
            borderRadius: 15,
          },
        ])}>
        <Ionicons name={icon} size={iconSize} color={focused ? '#fff' : colors.tabIconDefault} />
      </View>
      {showLabel ? (
        <Text
          numberOfLines={1}
          style={StyleSheet.flatten([
            styles.label,
            {
              color: focused ? colors.tint : colors.tabIconDefault,
              fontSize: label.length > 5 ? 9 : 10,
              fontWeight: focused ? '800' : '600',
            },
          ])}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * Dinamik alt dock — Ayarlar sağda sabit; diğer sekmeler kaydırılabilir.
 * Safari alt çubuğu için ekstra padding.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width: winW, height: winH } = useWindowDimensions();
  const { tabBarPadBottom, kisa } = useAltGuvenliBosluk();
  const [barW, setBarW] = useState(winW);
  const scrollRef = useRef<ScrollView>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setBarW(e.nativeEvent.layout.width);
  }, []);

  const ayarlarRoute = state.routes.find((r) => r.name === 'ayarlar');
  const digerRoutes = state.routes.filter((r) => r.name !== 'ayarlar');
  const pinW = Math.min(72, Math.max(56, Math.round(barW * 0.16)));
  const scrollW = Math.max(0, barW - pinW);
  const n = Math.max(1, digerRoutes.length);
  const itemMinW = Math.max(48, Math.min(64, Math.floor(scrollW / Math.min(n, 5))));
  const needScroll = n * itemMinW > scrollW + 4;
  const etiketGoster = !kisa && winH >= 520;
  const iconSize = itemMinW < 52 ? 16 : 18;
  const aktifKey = state.routes[state.index]?.key;
  const aktifName = state.routes[state.index]?.name;

  const pressFor = useCallback(
    (route: TabRoute, focused: boolean) => () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation]
  );

  const renderItem = useCallback(
    (route: TabRoute, opts?: { minW?: number; forceLabel?: boolean }) => {
      const index = state.routes.findIndex((r) => r.key === route.key);
      const focused = state.index === index;
      const { options } = descriptors[route.key];
      const label = ETIKET[route.name] ?? options.tabBarLabel ?? options.title ?? route.name;
      const icon = focused
        ? (SEKME_IKONLARI_DOLU[route.name] ?? 'ellipse')
        : (SEKME_IKONLARI[route.name] ?? 'ellipse-outline');

      return (
        <TabItem
          key={route.key}
          route={route}
          focused={focused}
          label={label}
          icon={icon}
          colors={colors}
          kisa={kisa}
          minW={opts?.minW ?? itemMinW}
          iconSize={iconSize}
          showLabel={opts?.forceLabel || etiketGoster}
          onPress={pressFor(route, focused)}
        />
      );
    },
    [state, descriptors, colors, kisa, itemMinW, iconSize, etiketGoster, pressFor]
  );

  // Aktif sekme kaydırma alanında görünür kalsın
  useEffect(() => {
    if (!aktifKey || aktifName === 'ayarlar' || !needScroll) return;
    const idx = digerRoutes.findIndex((r) => r.key === aktifKey);
    if (idx < 0) return;
    const x = Math.max(0, idx * itemMinW - itemMinW);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: true });
    });
  }, [aktifKey, aktifName, itemMinW, needScroll, digerRoutes]);

  const shellPadBottom =
    Platform.OS === 'web'
      ? Math.max(tabBarPadBottom, 20)
      : tabBarPadBottom;

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.flatten([
        styles.shell,
        {
          backgroundColor: scheme === 'dark' ? colors.card : '#fbfcf9',
          borderTopColor: colors.border,
          paddingBottom: shellPadBottom,
          paddingTop: kisa ? 4 : 6,
        },
      ])}>
      <View style={styles.row}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={needScroll}
          style={StyleSheet.flatten([styles.scroll, { width: scrollW }])}
          contentContainerStyle={styles.scrollContent}>
          {digerRoutes.map((route) => renderItem(route))}
        </ScrollView>
        {ayarlarRoute ? (
          <View
            style={StyleSheet.flatten([
              styles.pin,
              {
                width: pinW,
                borderLeftColor: colors.border,
              },
            ])}>
            {renderItem(ayarlarRoute, { minW: pinW - 4, forceLabel: true })}
          </View>
        ) : null}
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
    alignItems: 'stretch',
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pin: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
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
