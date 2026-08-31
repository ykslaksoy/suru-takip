import { iapOrtam, iapOrtamAciklama } from '@/kaynak/abonelik/iap-ortam';
import { test, type TestModul } from '../cerceve';

export const abonelikModul: TestModul = {
  grup: 'Abonelik / IAP',
  calistir() {
    const ortam = iapOrtam();
    const aciklama = iapOrtamAciklama();
    return [
      test('Abonelik / IAP', 'IAP ortamı tanımlı', ortam === 'simulasyon' || ortam === 'magaza'),
      test(
        'Abonelik / IAP',
        'Simülasyonda açıklama var',
        ortam !== 'simulasyon' || aciklama.includes('Simülasyon'),
      ),
      test(
        'Abonelik / IAP',
        'Mağaza anahtarı yoksa simülasyon',
        !!process.env.EXPO_PUBLIC_REVENUECAT_KEY?.trim()
          ? ortam === 'magaza'
          : ortam === 'simulasyon',
      ),
    ];
  },
};
