import { Redirect } from 'expo-router';

/** Eski menü yolu → sekme */
export default function VeterinerRedirect() {
  return <Redirect href="/(tabs)/veteriner" />;
}
