import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SekmeIkonAdi } from '@/bilesenler/ortak/SekmeIkonlari';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { SEKME_IKONLARI, SEKME_IKONLARI_DOLU } from '@/bilesenler/ortak/SekmeIkonlari';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { KILITLI_DOCK, KILITLI_DOCK_ADLARI } from '@/sabitler/HizliIslemler';

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

const DOCK_HREF: Record<string, string> = {
  index: '/(tabs)',
  suru: '/(tabs)/suru',
  stok: '/(tabs)/stok',
  'akilli-kuzu': '/(tabs)/akilli-kuzu',
  daha: '/(tabs)/daha',
};

function routeAd(name: string): string {
  return name.replace(/\/index$/, '');
}

function routeEslesir(routeName: string, dockAd: string): boolean {
  const n = routeAd(routeName);
  return n === dockAd || routeName === dockAd || n.endsWith(`/${dockAd}`) || n.endsWith(dockAd);
}

/**
 * Kilitli 5’li dock — Ana Sayfa, Sürü, Stok, Akıllı Kuzu, Daha.
 * Gizli sekmeler Daha üzerinden açılır.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tabBarPadBottom, kisa, darTelefon } = useAltGuvenliBosluk(88);
  const aktifHam = state.routes[state.index]?.name ?? 'index';
  const aktifAd = routeAd(aktifHam);
  const gizlenenAktif = !KILITLI_DOCK_ADLARI.includes(aktifAd) && !KILITLI_DOCK_ADLARI.includes(aktifHam);

  const shellPadBottom =
    Platform.OS === 'web' ? Math.max(tabBarPadBottom, darTelefon ? 20 : 16) : tabBarPadBottom;

  return (
    <View
      style={StyleSheet.flatten([
        styles.shell,
        {
          backgroundColor: scheme === 'dark' ? colors.card : '#ffffff',
          borderTopColor: colors.border,
          paddingBottom: shellPadBottom,
          paddingTop: kisa ? 4 : 8,
        },
      ])}>
      <View style={styles.row}>
        {KILITLI_DOCK.map((dock) => {
          const route = state.routes.find((r) => routeEslesir(r.name, dock.name));
          const focused =
            routeEslesir(aktifHam, dock.name) || (gizlenenAktif && dock.name === 'daha');
          const label = dock.title;
          const icon = focused
            ? (SEKME_IKONLARI_DOLU[dock.name] ?? 'ellipse')
            : (SEKME_IKONLARI[dock.name] ?? 'ellipse-outline');
          const renk = focused ? colors.tint : colors.tabIconDefault;

          return (
            <Pressable
              key={dock.name}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                if (route) {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                  return;
                }
                router.push(DOCK_HREF[dock.name] as never);
              }}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.item,
                  {
                    opacity: pressed ? 0.7 : 1,
                    minHeight: kisa ? 44 : 52,
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
                  },
                ])
              }>
              <Ionicons name={icon as SekmeIkonAdi} size={kisa ? 20 : 22} color={renk} />
              <Text
                numberOfLines={1}
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: renk,
                    fontSize: label.length > 10 ? 9 : 10,
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
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 1,
    minWidth: 0,
  },
  label: {
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.2,
  },
});
