import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

/**
 * Kilitli 5’li dock — Ana Sayfa, Sürü, Stok, Akıllı Kuzu, Daha.
 * Gizli sekmeler (sağlık/rasyon/vet/yolculuk) Daha üzerinden açılır.
 */
export function IzgaraTabBar(props: IzgaraTabBarProps | Record<string, unknown>) {
  const { state, descriptors, navigation } = props as IzgaraTabBarProps;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tabBarPadBottom, kisa } = useAltGuvenliBosluk();
  const aktifAd = state.routes[state.index]?.name ?? 'index';
  const gizlenenAktif = !KILITLI_DOCK_ADLARI.includes(aktifAd);

  const dockRoutes = KILITLI_DOCK.map((d) => state.routes.find((r) => r.name === d.name)).filter(
    (r): r is TabRoute => Boolean(r),
  );

  const shellPadBottom = Platform.OS === 'web' ? Math.max(tabBarPadBottom, 16) : tabBarPadBottom;

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
        {dockRoutes.map((route) => {
          const focused = route.name === aktifAd || (gizlenenAktif && route.name === 'daha');
          const meta = KILITLI_DOCK.find((d) => d.name === route.name);
          const options = descriptors[route.key]?.options;
          const label = meta?.title ?? options?.tabBarLabel ?? options?.title ?? route.name;
          const icon = focused
            ? (SEKME_IKONLARI_DOLU[route.name] ?? 'ellipse')
            : (SEKME_IKONLARI[route.name] ?? 'ellipse-outline');
          const renk = focused ? colors.tint : colors.tabIconDefault;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.item,
                  { opacity: pressed ? 0.7 : 1, minHeight: kisa ? 44 : 52 },
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
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
    minWidth: 0,
  },
  label: {
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.3,
  },
});
