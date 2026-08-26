import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useClientOnlyValue } from '@/bilesenler/ortak/useSadeceIstemci';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Sürü: '🐑',
    Stok: '📦',
    Sağlık: '💊',
    'Akıllı Kuzu': '🐑',
    Menü: '☰',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.7 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: { minHeight: 56 },
        headerShown: useClientOnlyValue(false, true),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="suru"
        options={{
          title: 'Sürü',
          tabBarIcon: ({ focused }) => <TabIcon label="Sürü" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stok"
        options={{
          title: 'Stok',
          tabBarIcon: ({ focused }) => <TabIcon label="Stok" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saglik"
        options={{
          title: 'Sağlık',
          tabBarIcon: ({ focused }) => <TabIcon label="Sağlık" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="akilli-kuzu"
        options={{
          title: 'Akıllı Kuzu',
          tabBarIcon: ({ focused }) => <TabIcon label="Akıllı Kuzu" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menü',
          tabBarIcon: ({ focused }) => <TabIcon label="Menü" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
