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
        'Supabase env ile bulut açılabilir',
        !!(
          process.env.EXPO_PUBLIC_SUPABASE_URL ||
          process.env.SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL
        ) || !bulut,
      ),
    ];
  },
};
