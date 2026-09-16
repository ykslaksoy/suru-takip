import { useEffect, useRef } from 'react';
import { router, usePathname } from 'expo-router';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';

/** İlk açılışta kurulum tamamlanmadıysa yönlendir */
export function GirisYontemiKurulumYonlendirici() {
  const { tercih, yukleniyor } = useGirisYontemi();
  const pathname = usePathname();
  const yonlendirildi = useRef(false);

  useEffect(() => {
    if (yukleniyor || yonlendirildi.current) return;
    if (tercih.kurulumTamam) return;
    if (pathname?.startsWith('/giris-yontemi')) return;
    yonlendirildi.current = true;
    router.replace('/giris-yontemi/kurulum' as never);
  }, [yukleniyor, tercih.kurulumTamam, pathname]);

  return null;
}
