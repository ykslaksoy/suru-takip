import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/** Eski /besi yolu → Yolculuk sekmesi */
export default function BesiRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/yolculuk');
  }, [router]);
  return <View />;
}
