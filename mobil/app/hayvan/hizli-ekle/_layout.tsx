import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SabitAltDock } from '@/bilesenler/ortak/SabitAltDock';

/**
 * Hızlı / toplu kuzu — ayrı stack + sabit alt dock (Ana Sayfa vb.).
 */
export default function HizliEkleLayout() {
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Stack
          screenOptions={{
            headerTintColor: '#2d6a4f',
            headerBackTitle: 'Geri',
          }}>
          <Stack.Screen name="index" options={{ title: 'Kuzu Ekle' }} />
          <Stack.Screen name="tek" options={{ title: 'Padok seç' }} />
          <Stack.Screen name="tek-form" options={{ title: 'Hızlı kuzu' }} />
          <Stack.Screen name="toplu" options={{ title: 'Toplu kabul' }} />
          <Stack.Screen name="sonuc" options={{ title: 'Kabul tamam', headerBackVisible: false }} />
        </Stack>
      </View>
      <SabitAltDock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
