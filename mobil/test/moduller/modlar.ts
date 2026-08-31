import { URUN_MODLARI } from '@/sabitler/ModlarSabit';
import { test, type TestModul } from '../cerceve';

export const modlarModul: TestModul = {
  grup: 'Ürün modları',
  calistir() {
    const mod1 = URUN_MODLARI.find((m) => m.id === 'mod1')!;
    const mod2 = URUN_MODLARI.find((m) => m.id === 'mod2')!;
    return [
      test('Ürün modları', 'Mod1 tam seviye', mod1.seviye === 'tam' && mod1.hazir),
      test('Ürün modları', 'Mod2 pilot', mod2.seviye === 'pilot'),
      test(
        'Ürün modları',
        'Mod3–4 pilot',
        URUN_MODLARI.filter((m) => m.id === 'mod3' || m.id === 'mod4').every(
          (m) => m.seviye === 'pilot',
        ),
      ),
      test('Ürün modları', 'Dört mod tanımlı', URUN_MODLARI.length === 4),
    ];
  },
};
