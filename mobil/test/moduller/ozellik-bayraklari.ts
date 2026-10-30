import { OZELLIK_BAYRAKLARI } from '@/sabitler/OzellikBayraklari';
import { test, type TestModul } from '../cerceve';

export const ozellikModul: TestModul = {
  grup: 'Özellik bayrakları',
  calistir() {
    const mod1 = OZELLIK_BAYRAKLARI.find((o) => o.id === 'mod1-hizli-besi')!;
    const mod27 = OZELLIK_BAYRAKLARI.find((o) => o.id === 'mod2-7')!;
    const bulut = OZELLIK_BAYRAKLARI.find((o) => o.id === 'bulut-senkron')!;
    const ocr = OZELLIK_BAYRAKLARI.find((o) => o.id === 'ocr-kupe')!;
    const iap = OZELLIK_BAYRAKLARI.find((o) => o.id === 'iap')!;
    const mera = OZELLIK_BAYRAKLARI.find((o) => o.id === 'mera-harita')!;
    return [
      test('Özellik bayrakları', 'Mod1 tam işaretli', mod1.durum === 'tam'),
      test('Özellik bayrakları', 'Mod 2–7 tam', mod27.durum === 'tam'),
      test('Özellik bayrakları', 'Bulut pilot', bulut.durum === 'pilot'),
      test('Özellik bayrakları', 'OCR gerçek (simülasyon yok)', ocr.durum !== ('simulasyon' as string)),
      test('Özellik bayrakları', 'IAP gerçek (simülasyon yok)', iap.durum !== ('simulasyon' as string)),
      test('Özellik bayrakları', 'Hiç simülasyon bayrağı yok', OZELLIK_BAYRAKLARI.every((o) => (o.durum as string) !== 'simulasyon')),
      test('Özellik bayrakları', 'Tüm bayraklar açıklamalı', OZELLIK_BAYRAKLARI.every((o) => o.aciklama.length > 5)),
      test('Özellik bayrakları', 'Mera haritası pilot', mera.durum === 'pilot'),
    ];
  },
};
