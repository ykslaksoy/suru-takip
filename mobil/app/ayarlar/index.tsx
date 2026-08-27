import { Redirect } from 'expo-router';

/** Eski yol → sekme */
export default function AyarlarRedirect() {
  return <Redirect href="/(tabs)/ayarlar" />;
}
