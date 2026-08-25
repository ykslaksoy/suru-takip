import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/context/DatabaseContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <DatabaseProvider>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerTintColor: '#2d6a4f' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="animal/add" options={{ title: 'Hayvan Ekle', presentation: 'modal' }} />
          <Stack.Screen name="animal/[id]" options={{ title: 'Hayvan Detay' }} />
          <Stack.Screen name="animal/[id]/weight" options={{ title: 'Kilo Takibi' }} />
          <Stack.Screen name="animal/[id]/health" options={{ title: 'Sağlık Kayıtları' }} />
          <Stack.Screen name="subscription" options={{ title: 'Abonelik', presentation: 'modal' }} />
          <Stack.Screen name="beta" options={{ title: 'Beta Pilot' }} />
          <Stack.Screen name="ration" options={{ title: 'Rasyon Hesaplayıcı' }} />
          <Stack.Screen name="vet" options={{ title: 'Akıllı Veteriner' }} />
          <Stack.Screen name="turkvet-export" options={{ title: 'TÜRKVET Export' }} />
          <Stack.Screen name="wireframes" options={{ title: 'Wireframe' }} />
        </Stack>
      </SubscriptionProvider>
    </DatabaseProvider>
  );
}
