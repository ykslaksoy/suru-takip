import { VET_DISCLAIMER } from '@/sabitler/YasalMetinler';
import { KULLANIM_KOSULLARI, KVKK_OZET, VET_UYARI_KISA } from '@/sabitler/YasalMetinler';
import { test, type TestModul } from '../cerceve';

export const yasalModul: TestModul = {
  grup: 'Yasal / uyarı metinleri',
  calistir() {
    return [
      test('Yasal / uyarı metinleri', 'VET_DISCLAIMER tanımlı', VET_DISCLAIMER.length > 20),
      test(
        'Yasal / uyarı metinleri',
        'Disclaimer veteriner vurgusu',
        /veteriner|hekim/i.test(VET_DISCLAIMER),
      ),
      test('Yasal / uyarı metinleri', 'KVKK metni', KVKK_OZET.includes('cihaz')),
      test('Yasal / uyarı metinleri', 'Kullanım koşulları', KULLANIM_KOSULLARI.includes('veteriner')),
      test('Yasal / uyarı metinleri', 'Kısa vet uyarısı', VET_UYARI_KISA.length > 10),
    ];
  },
};
