import { URUN_MODLARI, aktifModaCoz, getMod } from '@/sabitler/ModlarSabit';
import { test, type TestModul } from '../cerceve';

const BEKLENEN = [
  'Kuzu Besi',
  'Etçi Koyunculuk + Kuzu Besi',
  'Damızlık Et Kuzusu Yetiştiriciliği',
  'Damızlık Süt Kuzusu Yetiştiriciliği',
  'Süt Koyunculuğu',
  'Süt Koyunculuğu + Kuzu Besi',
  'Süt Koyunculuğu + Etçi Koyunculuk',
];

export const modlarModul: TestModul = {
  grup: 'Ürün modları',
  calistir() {
    const mod1 = URUN_MODLARI.find((m) => m.id === 'mod1')!;
    const sirali = [...URUN_MODLARI].sort((a, b) => a.no - b.no);

    return [
      test('Ürün modları', 'Yedi mod tanımlı', URUN_MODLARI.length === 7),
      test(
        'Ürün modları',
        'Ekran sırası no 1–7',
        sirali.every((m, i) => m.no === i + 1 && m.baslik === BEKLENEN[i]),
      ),
      test('Ürün modları', 'Mod1 Kuzu Besi tam', mod1.no === 1 && mod1.seviye === 'tam' && mod1.hazir),
      test(
        'Ürün modları',
        'Mod 2–7 tam ve seçilebilir',
        URUN_MODLARI.filter((m) => m.id !== 'mod1').every((m) => m.seviye === 'tam' && m.hazir),
      ),
      test(
        'Ürün modları',
        'mod2 = Etçi Koyunculuk + Kuzu Besi (2. sıra)',
        getMod('mod2').id === 'mod2' && getMod('mod2').no === 2 && getMod('mod2').baslik === BEKLENEN[1] && getMod('mod2').hazir,
      ),
      test('Ürün modları', 'Kayıtlı mod2 → mod2', aktifModaCoz('mod2') === 'mod2'),
      test(
        'Ürün modları',
        'Bilinmeyen kayıt → mod1',
        aktifModaCoz('xyz') === 'mod1' && aktifModaCoz(null) === 'mod1',
      ),
      test('Ürün modları', 'Eski Damızlık kuzu id korunur', getMod('mod3').baslik === BEKLENEN[2] && getMod('mod3').no === 3),
      test('Ürün modları', 'mod6 4. · mod5 6. sırada', getMod('mod6').no === 4 && getMod('mod5').no === 6),
      test('Ürün modları', 'Süt koyunculuğu id korunur', getMod('mod4').baslik === BEKLENEN[4] && getMod('mod4').no === 5),
      test('Ürün modları', 'Mod7 yedinci', getMod('mod7').no === 7 && getMod('mod7').baslik === BEKLENEN[6]),
    ];
  },
};
