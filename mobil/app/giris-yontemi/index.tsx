import { Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { GirisYontemiFormu } from '@/bilesenler/giris-yontemi/GirisYontemiFormu';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

export default function GirisYontemiAyarScreen() {
  const { tercih, kaydet } = useGirisYontemi();

  return (
    <>
      <Stack.Screen options={{ title: 'Kuzu seçim & tartım girişi' }} />
      <GirisYontemiFormu
        baslik="Giriş yöntemleri"
        aciklama="Değişiklik tüm akışlara yansır. Ekran başına ayrı seçim yok."
        baslangicKuzu={tercih.kuzuSecim}
        baslangicTartim={tercih.tartimGiris}
        kaydetMetin="Tercihleri kaydet"
        onKaydet={async (kuzu, tartim) => {
          await kaydet(kuzu, tartim, { kurulumTamam: true });
          uyar('Kaydedildi', 'Giriş yöntemleri güncellendi.');
          router.back();
        }}
      />
    </>
  );
}
