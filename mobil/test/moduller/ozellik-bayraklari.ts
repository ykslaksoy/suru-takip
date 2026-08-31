import { OZELLIK_BAYRAKLARI } from '@/sabitler/OzellikBayraklari';
import { test, type TestModul } from '../cerceve';

export const ozellikModul: TestModul = {
  grup: 'Özellik bayrakları',
  calistir() {
    const mod1 = OZELLIK_BAYRAKLARI.find((o) => o.id === 'mod1-hizli-besi')!;
    const bulut = OZELLIK_BAYRAKLARI.find((o) => o.id === 'bulut-senkron')!;
    const ocr = OZELLIK_BAYRAKLARI.find((o) => o.id === 'ocr-kupe')!;
    const iap = OZELLIK_BAYRAKLARI.find((o) => o.id === 'iap')!;
    return [
      test('Özellik bayrakları', 'Mod1 tam işaretli', mod1.durum === 'tam'),
      test('Özellik bayrakları', 'Bulut yakında', bulut.durum === 'yakinda'),
      test('Özellik bayrakları', 'OCR simülasyon', ocr.durum === 'simulasyon'),
      test('Özellik bayrakları', 'IAP simülasyon', iap.durum === 'simulasyon'),
      test('Özellik bayrakları', 'Tüm bayraklar açıklamalı', OZELLIK_BAYRAKLARI.every((o) => o.aciklama.length > 5)),
    ];
  },
};
