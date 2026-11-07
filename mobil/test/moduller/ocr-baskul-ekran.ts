import { ocrBaskulEkranNormalize } from '@/kaynak/ocr/baskul-ekran';
import { test, type TestModul } from '../cerceve';

export const ocrBaskulEkranModul: TestModul = {
  grup: 'Baskül ekran OCR',
  calistir() {
    const g = 'Baskül ekran OCR';
    return [
      test(g, 'Tek kg', ocrBaskulEkranNormalize('68.5 kg').ok === true),
      test(g, 'Belirsiz', ocrBaskulEkranNormalize('45 kg ve 68 kg').ok === false),
      test(g, 'Boş', ocrBaskulEkranNormalize('  ').ok === false),
    ];
  },
};
