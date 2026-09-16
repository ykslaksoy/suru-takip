import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SekmeIkonAdi } from '@/bilesenler/ortak/SekmeIkonlari';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { SEKME_IKONLARI, SEKME_IKONLARI_DOLU } from '@/bilesenler/ortak/SekmeIkonlari';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { KILITLI_DOCK } from '@/sabitler/HizliIslemler';

const DOCK_HREF: Record<string, string> = {
  index: '/(tabs)',
  suru: '/(tabs)/suru',
  stok: '/(tabs)/stok',
  'akilli-kuzu': '/(tabs)/akilli-kuzu',
  daha: '/(tabs)/daha',
};

/**
 * Stack ekranlarında (Görevler / hızlı kuzu) görünen sabit 5’li dock.
 * Tabs dışında da Ana Sayfa’ya dönüş sağlar.
 */
export function SabitAltDock() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tabBarPadBottom, kisa } = useAltGuvenliBosluk(72);
  const pathname = usePathname() ?? '';
  const shellPadBottom = tabBarPadBottom;

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
          const href = DOCK_HREF[dock.name];
          const focused =
            dock.name === 'index'
              ? pathname === '/' || pathname.endsWith('/(tabs)') || pathname === ''
              : pathname.includes(`/${dock.name}`);
          const icon = focused
            ? (SEKME_IKONLARI_DOLU[dock.name] ?? 'ellipse')
            : (SEKME_IKONLARI[dock.name] ?? 'ellipse-outline');
          const renk = focused ? colors.tint : colors.tabIconDefault;

          return (
            <Pressable
              key={dock.name}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={dock.title}
              onPress={() => router.push(href as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.item,
                  {
                    opacity: pressed ? 0.7 : 1,
                    minHeight: kisa ? 48 : 56,
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
                  },
                ])
              }>
              <Ionicons name={icon as SekmeIkonAdi} size={kisa ? 20 : 24} color={renk} />
              <Text
                numberOfLines={1}
                style={StyleSheet.flatten([
                  styles.label,
                  {
                    color: renk,
                    fontSize: dock.title.length > 10 ? 9 : 11,
                    fontWeight: focused ? '800' : '700',
                  },
                ])}>
                {dock.title}
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
