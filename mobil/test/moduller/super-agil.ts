import { test, type TestModul } from '../cerceve';
import {
  OZELLIK_MATRISI,
  RAKIPLER,
  SUPER_AGIL_URUN,
  superAgilSkor,
  toplamSkor,
} from '@/kaynak/urun/super-agil-model';

export const superAgilModul: TestModul = {
  grup: 'SüperAğıl ürün modeli',
  calistir() {
    return [
      test('SüperAğıl ürün modeli', '10 rakip tanımlı', RAKIPLER.length === 10),
      test('SüperAğıl ürün modeli', 'En az 20 özellik satırı', OZELLIK_MATRISI.length >= 20),
      test('SüperAğıl ürün modeli', 'Ürün adı SüperAğıl', SUPER_AGIL_URUN.ad === 'SüperAğıl'),
      test(
        'SüperAğıl ürün modeli',
        'Her satırda 10 rakip skoru',
        OZELLIK_MATRISI.every((s) => RAKIPLER.every((r) => typeof s.rakipSkor[r.id] === 'number'))
      ),
      test(
        'SüperAğıl ürün modeli',
        'Skorlar 0–10 aralığında',
        OZELLIK_MATRISI.every(
          (s) =>
            s.suruyonSkor >= 0 &&
            s.suruyonSkor <= 10 &&
            Object.values(s.rakipSkor).every((v) => v >= 0 && v <= 10)
        )
      ),
      test(
        'SüperAğıl ürün modeli',
        'SüperAğıl toplamı SürüYön’den yüksek',
        toplamSkor(superAgilSkor).toplam > toplamSkor((s) => s.suruyonSkor).toplam
      ),
    ];
  },
};
