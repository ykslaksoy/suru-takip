import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { WebDurumCubugu } from '@/bilesenler/ortak/WebDurumCubugu';

/** 7 ana sekme — kısa etiket (dar ekran) */
const TABS: { name: string; title: string; short: string; icon: string }[] = [
  { name: 'index', title: 'Ana Sayfa', short: 'Ana', icon: '🏠' },
  { name: 'suru', title: 'Sürü', short: 'Sürü', icon: '🐑' },
  { name: 'stok', title: 'Stok', short: 'Stok', icon: '📦' },
  { name: 'saglik', title: 'Sağlık', short: 'Sağlık', icon: '💊' },
  { name: 'rasyon', title: 'Rasyon', short: 'Rasyon', icon: '🌾' },
  { name: 'veteriner', title: 'Akıllı Veteriner', short: 'Veteriner', icon: '🩺' },
  { name: 'akilli-kuzu', title: 'Akıllı Kuzu', short: 'Kuzu', icon: '✨' },
];

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.65 }}>{icon}</Text>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={{ flex: 1 }}>
      <WebDurumCubugu />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
          tabBarStyle: {
            minHeight: Platform.OS === 'web' ? 62 : 58,
            paddingBottom: Platform.OS === 'web' ? 8 : 4,
            borderTopWidth: 1,
            borderTopColor: Colors[colorScheme].border,
          },
          headerShown: false,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarLabel: t.short,
            tabBarIcon: ({ focused }) => <TabIcon icon={t.icon} focused={focused} />,
          }}
        />
      ))}
      </Tabs>
    </View>
  );
}
