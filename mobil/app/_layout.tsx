import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/baglam/VeritabaniBaglami';
import { SubscriptionProvider } from '@/baglam/AbonelikBaglami';
import { AnaSayfaProvider } from '@/baglam/AnaSayfaBaglami';
import { ModProvider } from '@/baglam/ModBaglami';
import { WebOnizlemeCercevesi } from '@/bilesenler/ortak/WebOnizlemeCercevesi';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../varliklar/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <WebOnizlemeCercevesi>
      <DatabaseProvider>
        <SubscriptionProvider>
          <AnaSayfaProvider>
            <ModProvider>
              <Stack screenOptions={{ headerTintColor: '#2d6a4f' }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="hayvan/ekle" options={{ title: 'Hayvan Ekle', presentation: 'modal' }} />
                <Stack.Screen name="hayvan/[id]" options={{ title: 'Hayvan Detay' }} />
                <Stack.Screen name="hayvan/[id]/kilo" options={{ title: 'Kilo Takibi' }} />
                <Stack.Screen name="hayvan/[id]/saglik" options={{ title: 'Sağlık Kayıtları' }} />
                <Stack.Screen name="abonelik" options={{ title: 'Abonelik', presentation: 'modal' }} />
                <Stack.Screen name="beta" options={{ title: 'Pilot Program' }} />
                <Stack.Screen name="turkvet-aktar" options={{ title: 'TÜRKVET Dışa Aktarım' }} />
                <Stack.Screen name="ana-sayfa/duzenle" options={{ title: 'Ana ekranı planla', presentation: 'modal' }} />
                <Stack.Screen name="ayarlar/index" options={{ headerShown: false }} />
                <Stack.Screen name="besi/index" options={{ headerShown: false }} />
              </Stack>
            </ModProvider>
          </AnaSayfaProvider>
        </SubscriptionProvider>
      </DatabaseProvider>
    </WebOnizlemeCercevesi>
  );
}
