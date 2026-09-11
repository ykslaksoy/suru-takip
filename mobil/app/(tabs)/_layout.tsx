import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { IzgaraTabBar } from '@/bilesenler/ortak/IzgaraTabBar';

const GIZLI: { name: string; title: string }[] = [
  { name: 'saglik', title: 'Sağlık' },
  { name: 'rasyon', title: 'Rasyon' },
  { name: 'veteriner', title: 'Veteriner' },
  { name: 'yolculuk', title: 'Yolculuk' },
];

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <IzgaraTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
          headerShown: false,
        }}>
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarLabel: 'Ana Sayfa' }} />
        <Tabs.Screen name="suru" options={{ title: 'Sürü', tabBarLabel: 'Sürü' }} />
        <Tabs.Screen name="stok" options={{ title: 'Stok', tabBarLabel: 'Stok' }} />
        <Tabs.Screen name="akilli-kuzu" options={{ title: 'Akıllı Kuzu', tabBarLabel: 'Akıllı Kuzu' }} />
        <Tabs.Screen name="daha" options={{ title: 'Daha', tabBarLabel: 'Daha' }} />
        {GIZLI.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              href: null,
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}
