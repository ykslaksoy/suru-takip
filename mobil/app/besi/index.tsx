import { Redirect } from 'expo-router';

/** Eski yol → Yolculuk sekmesi */
export default function BesiRedirect() {
  return <Redirect href="/(tabs)/yolculuk" />;
}
