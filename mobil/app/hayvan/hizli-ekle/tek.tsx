import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { PadokButonIzgarasi } from '@/bilesenler/hizli-kuzu/PadokButonIzgarasi';
import { VARSAYILAN_KABUL_PADOK } from '@/kaynak/suru/hizli-kuzu-kabul';

/** Tek kuzu — padok butonları ayrı sayfa */
export default function HizliTekPadokScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);

  return (
    <>
      <Stack.Screen options={{ title: 'Padok seç' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <Text style={[styles.title, { color: colors.text }]}>Hangi padoka?</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Butona dokunun — form ayrı sayfada açılır.
        </Text>
        <PadokButonIzgarasi
          oneriAd={VARSAYILAN_KABUL_PADOK}
          onSec={(padok) =>
            router.push({
              pathname: '/hayvan/hizli-ekle/tek-form',
              params: { padok },
            } as never)
          }
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 16, lineHeight: 21 },
});
