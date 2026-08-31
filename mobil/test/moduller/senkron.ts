import { bulutSenkronAktif } from '@/sabitler/Ortam';
import { test, type TestModul } from '../cerceve';

export const senkronModul: TestModul = {
  grup: 'Senkron mesajları',
  calistir() {
    const bulut = bulutSenkronAktif();
    return [
      test(
        'Senkron mesajları',
        'Bulut kapalıyken otomatik senkron iddiası yok',
        !bulut,
        'Banner yerel yedek mesajı gösterir',
      ),
      test(
        'Senkron mesajları',
        'API URL ile bulut açılabilir',
        typeof process.env.EXPO_PUBLIC_API_URL === 'string' || !bulut,
      ),
    ];
  },
};
