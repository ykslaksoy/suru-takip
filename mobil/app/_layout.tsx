import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { DatabaseProvider } from '@/baglam/VeritabaniBaglami';
import { SubscriptionProvider } from '@/baglam/AbonelikBaglami';
import { AnaSayfaProvider } from '@/baglam/AnaSayfaBaglami';
import { ModProvider } from '@/baglam/ModBaglami';
import { AyarlarProvider } from '@/baglam/AyarlarBaglami';
import { WebOnizlemeCercevesi } from '@/bilesenler/ortak/WebOnizlemeCercevesi';
import { AyarlarKaplama } from '@/bilesenler/ayarlar/AyarlarKaplama';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../varliklar/fonts/SpaceMono-Regular.ttf'),
    ...Ionicons.font,
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
              <AyarlarProvider>
                <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
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
                    <Stack.Screen name="gorevler/index" options={{ title: 'Görevler' }} />
                    <Stack.Screen name="ses/index" options={{ title: 'Sesli komut' }} />
                    <Stack.Screen name="seri-giris/index" options={{ title: 'Seri ahır modu' }} />
                    <Stack.Screen name="ayarlar/index" options={{ title: 'Ayarlar', headerShown: true }} />
                    <Stack.Screen name="besi/index" options={{ title: 'Yolculuk' }} />
                    <Stack.Screen name="sistem-kontrol/index" options={{ title: 'Sistem kontrolü' }} />
                    <Stack.Screen name="isletme-profil/index" options={{ title: 'İşletme profili' }} />
                    <Stack.Screen name="yasal/gizlilik" options={{ title: 'KVKK' }} />
                    <Stack.Screen name="yasal/kullanim" options={{ title: 'Kullanım koşulları' }} />
                  </Stack>
                  <AyarlarKaplama />
                </View>
              </AyarlarProvider>
            </ModProvider>
          </AnaSayfaProvider>
        </SubscriptionProvider>
      </DatabaseProvider>
    </WebOnizlemeCercevesi>
  );
}
