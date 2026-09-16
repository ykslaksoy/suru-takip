import { useEffect, useRef } from 'react';
import { router, usePathname } from 'expo-router';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { girisYontemiKurulumTamamMi } from '@/kaynak/giris-yontemi';

/** İlk açılışta kurulum tamamlanmadıysa yönlendir */
export function GirisYontemiKurulumYonlendirici() {
  const { tercih, yukleniyor } = useGirisYontemi();
  const pathname = usePathname();
  const yonlendirildi = useRef(false);

  useEffect(() => {
    if (yukleniyor || yonlendirildi.current) return;
    if (tercih.kurulumTamam) return;
    if (pathname?.startsWith('/giris-yontemi')) return;

    let cancelled = false;
    void (async () => {
      // Kurulum kaydı sonrası router.replace ile tabs'a geçildiğinde React context
      // henüz güncellenmemiş olabilir; kalıcı depoyu doğrulayarak geri yönlendirmeyi önle.
      const tamam = await girisYontemiKurulumTamamMi();
      if (cancelled || yonlendirildi.current || tamam) return;
      yonlendirildi.current = true;
      router.replace('/giris-yontemi/kurulum' as never);
    })();

    return () => {
      cancelled = true;
    };
  }, [yukleniyor, tercih.kurulumTamam, pathname]);

  return null;
}
