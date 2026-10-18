import { URUN_MODLARI, aktifModaCoz, getMod } from '@/sabitler/ModlarSabit';
import { test, type TestModul } from '../cerceve';

const BEKLENEN = [
  'Kuzu Besi',
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
      test('Ürün modları', 'Beş mod tanımlı', URUN_MODLARI.length === 5),
      test(
        'Ürün modları',
        'Mod adları ve sırası',
        sirali.every((m, i) => m.baslik === BEKLENEN[i] && m.no === i + 1),
      ),
      test('Ürün modları', 'Mod1 Kuzu Besi tam', mod1.no === 1 && mod1.seviye === 'tam' && mod1.hazir),
      test(
        'Ürün modları',
        'Mod 2–5 yakında, seçilemez',
        URUN_MODLARI.filter((m) => m.id !== 'mod1').every((m) => m.seviye === 'yakinda' && !m.hazir),
      ),
      test('Ürün modları', 'Koç katarak besi listede yok', !URUN_MODLARI.some((m) => m.id === 'mod2')),
      test('Ürün modları', 'Eski mod2 → mod1', getMod('mod2').id === 'mod1' && aktifModaCoz('mod2') === 'mod1'),
      test(
        'Ürün modları',
        'Yakında / bilinmeyen kayıt → mod1',
        aktifModaCoz('mod3') === 'mod1' && aktifModaCoz('mod5') === 'mod1' && aktifModaCoz('xyz') === 'mod1' && aktifModaCoz(null) === 'mod1',
      ),
      test('Ürün modları', 'Eski Damızlık kuzu id korunur', getMod('mod3').baslik === BEKLENEN[1]),
      test('Ürün modları', 'Süt koyunculuğu id korunur', getMod('mod4').baslik === BEKLENEN[3]),
    ];
  },
};
