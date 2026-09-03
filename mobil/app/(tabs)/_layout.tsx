import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { WebDurumCubugu } from '@/bilesenler/ortak/WebDurumCubugu';
import { IzgaraTabBar } from '@/bilesenler/ortak/IzgaraTabBar';

/** 9 sekme — modern tek satır vektör dock */
const TABS: { name: string; title: string; short: string }[] = [
  { name: 'index', title: 'Ana Sayfa', short: 'Ana' },
  { name: 'suru', title: 'Sürü', short: 'Sürü' },
  { name: 'stok', title: 'Stok', short: 'Stok' },
  { name: 'saglik', title: 'Sağlık', short: 'Sağlık' },
  { name: 'rasyon', title: 'Rasyon', short: 'Rasyon' },
  { name: 'veteriner', title: 'Veteriner', short: 'Vet' },
  { name: 'akilli-kuzu', title: 'Akıllı Kuzu', short: 'Kuzu' },
  { name: 'yolculuk', title: 'Yolculuk', short: 'Yol' },
  { name: 'ayarlar', title: 'Ayarlar', short: 'Ayar' },
];

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={{ flex: 1 }}>
      <WebDurumCubugu />
      <Tabs
        tabBar={(props) => <IzgaraTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
          headerShown: false,
        }}>
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarLabel: t.short,
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}
