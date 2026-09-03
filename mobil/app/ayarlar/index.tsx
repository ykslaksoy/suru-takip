import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/** Eski /ayarlar yolu → sekme (Redirect Slot hatası vermesin diye) */
export default function AyarlarRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/ayarlar');
  }, [router]);
  return <View />;
}
