import {
  appOrtam,
  bulutSenkronAktif,
  demoSeedOtomatik,
  isletmeProfilZorunlu,
} from '@/sabitler/Ortam';
import { test, type TestModul } from '../cerceve';

export const ortamModul: TestModul = {
  grup: 'Ortam ayarları',
  calistir() {
    const ortam = appOrtam();
    return [
      test('Ortam ayarları', 'Ortam tanımlı', ['gelistirme', 'pilot', 'uretim'].includes(ortam)),
      test(
        'Ortam ayarları',
        'Geliştirmede demo seed açık',
        ortam !== 'gelistirme' || demoSeedOtomatik(),
      ),
      test(
        'Ortam ayarları',
        'Pilot/üretimde demo seed kapalı',
        ortam === 'gelistirme' || !demoSeedOtomatik(),
      ),
      test(
        'Ortam ayarları',
        'Pilot/üretimde profil zorunlu',
        ortam === 'gelistirme' || isletmeProfilZorunlu(),
      ),
      test(
        'Ortam ayarları',
        'Bulut senkron varsayılan kapalı',
        !bulutSenkronAktif() || !!process.env.EXPO_PUBLIC_API_URL,
      ),
    ];
  },
};
