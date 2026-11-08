/**
 * Expo içi /admin — statik admin paneline tam sayfa yönlendirme.
 * Eski SW veya client navigasyonu Expo kabuğunu gösterirse 404 yerine köprü.
 */
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

function adminPanelUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return `${window.location.origin}/admin/index.html`;
}

export default function AdminKopruScreen() {
  useEffect(() => {
    const url = adminPanelUrl();
    if (Platform.OS === 'web' && url) window.location.replace(url);
  }, []);

  const ac = () => {
    const url = adminPanelUrl();
    if (url) window.location.assign(url);
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Admin panel yalnız web’de.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontWeight: '700' }}>Admin panel</Text>
      <Text style={{ color: '#555' }}>
        Ayrı oturum sayfasına yönlendiriliyorsunuz. Otomatik açılmazsa dokunun.
      </Text>
      <Pressable onPress={ac} accessibilityRole="link">
        <Text style={{ color: '#1a7f4b', fontWeight: '800' }}>Admin paneli aç</Text>
      </Pressable>
    </View>
  );
}
