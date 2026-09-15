import { Stack } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

/** Sürü sekmesi: padok listesi → padok hayvanları ayrı stack sayfası */
export default function SuruStackLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.tint,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="padok/[ad]" options={{ title: 'Padok', headerBackTitle: 'Sürü' }} />
    </Stack>
  );
}
