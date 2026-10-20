import { VET_DISCLAIMER } from '@/sabitler/YasalMetinler';
import {
  KULLANIM_KOSULLARI,
  KULLANIM_SARTLARI_ETKIN_TARIH,
  KULLANIM_SARTLARI_ILETISIM,
  KVKK_OZET,
  VET_UYARI_KISA,
} from '@/sabitler/YasalMetinler';
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
      test('Yasal / uyarı metinleri', 'Kullanım şartları — otomatik erişim', /bot|otomatik/i.test(KULLANIM_KOSULLARI)),
      test('Yasal / uyarı metinleri', 'Kullanım şartları — Türkiye hukuku', /Türkiye/.test(KULLANIM_KOSULLARI)),
      test('Yasal / uyarı metinleri', 'Kullanım şartları — veteriner', KULLANIM_KOSULLARI.includes('veteriner')),
      test(
        'Yasal / uyarı metinleri',
        'Kullanım şartları — yürürlük tarihi',
        KULLANIM_SARTLARI_ETKIN_TARIH === '2026-10-20',
      ),
      test(
        'Yasal / uyarı metinleri',
        'Kullanım şartları — iletişim',
        KULLANIM_KOSULLARI.includes(KULLANIM_SARTLARI_ILETISIM),
      ),
      test('Yasal / uyarı metinleri', 'Kısa vet uyarısı', VET_UYARI_KISA.length > 10),
    ];
  },
};
