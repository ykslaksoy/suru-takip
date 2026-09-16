import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { GirisYontemiFormu } from '@/bilesenler/giris-yontemi/GirisYontemiFormu';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';

export default function GirisYontemiKurulumScreen() {
  const { tercih, kurulumTamamla } = useGirisYontemi();
  const [anaSayfayaGit, setAnaSayfayaGit] = useState(false);

  useEffect(() => {
    if (!anaSayfayaGit || !tercih.kurulumTamam) return;
    router.replace('/(tabs)' as never);
  }, [anaSayfayaGit, tercih.kurulumTamam]);

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
          setAnaSayfayaGit(true);
        }}
      />
    </>
  );
}
