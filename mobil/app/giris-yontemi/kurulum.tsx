import { Stack, router } from 'expo-router';
import { GirisYontemiFormu } from '@/bilesenler/giris-yontemi/GirisYontemiFormu';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';

export default function GirisYontemiKurulumScreen() {
  const { tercih, kurulumTamamla } = useGirisYontemi();

  return (
    <>
      <Stack.Screen options={{ title: 'Giriş yöntemi kurulumu', headerBackVisible: false }} />
      <GirisYontemiFormu
        baslik="Nasıl çalışacaksınız?"
        aciklama="Bir kez seçin — kuzu seçimi ve tartım girişi tüm uygulamada aynı kalır."
        baslangicKuzu={tercih.kuzuSecim}
        baslangicTartim={tercih.tartimGiris}
        kaydetMetin="Kaydet ve başla"
        onKaydet={async (kuzu, tartim) => {
          await kurulumTamamla(kuzu, tartim);
          router.replace('/(tabs)' as never);
        }}
      />
    </>
  );
}
