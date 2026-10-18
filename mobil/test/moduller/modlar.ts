import { URUN_MODLARI, aktifModaCoz, getMod } from '@/sabitler/ModlarSabit';
import { test, type TestModul } from '../cerceve';

const BEKLENEN = [
  'Kuzu Besi',
  'Etçi Koyunculuk + Kuzu Besi',
  'Damızlık Et Kuzusu Yetiştiriciliği',
  'Damızlık Süt Kuzusu Yetiştiriciliği',
  'Süt Koyunculuğu',
  'Süt Koyunculuğu + Kuzu Besi',
];

export const modlarModul: TestModul = {
  grup: 'Ürün modları',
  calistir() {
    const mod1 = URUN_MODLARI.find((m) => m.id === 'mod1')!;
    const sirali = [...URUN_MODLARI].sort((a, b) => a.no - b.no);
    return [
      test('Ürün modları', 'Altı mod tanımlı', URUN_MODLARI.length === 6),
      test(
        'Ürün modları',
        'Mod adları ve sırası',
        sirali.every((m, i) => m.baslik === BEKLENEN[i] && m.no === i + 1),
      ),
      test('Ürün modları', 'Mod1 Kuzu Besi tam', mod1.no === 1 && mod1.seviye === 'tam' && mod1.hazir),
      test(
        'Ürün modları',
        'Mod 2–6 yakında, seçilemez',
        URUN_MODLARI.filter((m) => m.id !== 'mod1').every((m) => m.seviye === 'yakinda' && !m.hazir),
      ),
      test(
        'Ürün modları',
        'mod2 = Etçi Koyunculuk + Kuzu Besi (2. sıra, yakında)',
        getMod('mod2').id === 'mod2' && getMod('mod2').no === 2 && getMod('mod2').baslik === BEKLENEN[1] && !getMod('mod2').hazir,
      ),
      test('Ürün modları', 'Kayıtlı mod2 → Kuzu Besi açılır', aktifModaCoz('mod2') === 'mod1'),
      test(
        'Ürün modları',
        'Yakında / bilinmeyen kayıt → mod1',
        aktifModaCoz('mod3') === 'mod1' && aktifModaCoz('mod5') === 'mod1' && aktifModaCoz('xyz') === 'mod1' && aktifModaCoz(null) === 'mod1',
      ),
      test('Ürün modları', 'Eski Damızlık kuzu id korunur', getMod('mod3').baslik === BEKLENEN[2] && getMod('mod3').no === 3),
      test('Ürün modları', 'mod6 4. · mod5 6. sırada', getMod('mod6').no === 4 && getMod('mod5').no === 6),
      test('Ürün modları', 'Süt koyunculuğu id korunur', getMod('mod4').baslik === BEKLENEN[4] && getMod('mod4').no === 5),
    ];
  },
};
