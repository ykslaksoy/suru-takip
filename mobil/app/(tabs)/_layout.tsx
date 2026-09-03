import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { WebDurumCubugu } from '@/bilesenler/ortak/WebDurumCubugu';
import { IzgaraTabBar } from '@/bilesenler/ortak/IzgaraTabBar';

/** 9 sekme — kompakt tek satır dock (3×3 kaldırıldı) */
const TABS: { name: string; title: string; short: string; emoji: string }[] = [
  { name: 'index', title: 'Ana Sayfa', short: 'Ana', emoji: '🏠' },
  { name: 'suru', title: 'Sürü', short: 'Sürü', emoji: '🐑' },
  { name: 'stok', title: 'Stok', short: 'Stok', emoji: '📦' },
  { name: 'saglik', title: 'Sağlık', short: 'Sağlık', emoji: '💊' },
  { name: 'rasyon', title: 'Rasyon', short: 'Rasyon', emoji: '🌾' },
  { name: 'veteriner', title: 'Veteriner', short: 'Vet', emoji: '🩺' },
  { name: 'akilli-kuzu', title: 'Akıllı Kuzu', short: 'Kuzu', emoji: '✨' },
  { name: 'yolculuk', title: 'Yolculuk', short: 'Yol', emoji: '🛤️' },
  { name: 'ayarlar', title: 'Ayarlar', short: 'Ayar', emoji: '⚙️' },
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
            options={
              {
                title: t.title,
                tabBarLabel: t.short,
                tabBarEmoji: t.emoji,
              } as never
            }
          />
        ))}
      </Tabs>
    </View>
  );
}
