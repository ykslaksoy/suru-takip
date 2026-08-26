import { Redirect } from 'expo-router';

/** Eski menü yolu → sekme */
export default function RasyonRedirect() {
  return <Redirect href="/(tabs)/rasyon" />;
}
