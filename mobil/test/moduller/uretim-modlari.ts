import { ONERILEN_PLANLAR } from '@/kaynak/gorevler/saglik-plani-paketleri';
import { onerilenPlanAcikMiSync } from '@/kaynak/gorevler/saglik-plani-mod';
import { aktifModaCoz, getMod } from '@/sabitler/ModlarSabit';
import { test, type TestModul } from '../cerceve';

export const uretimModlariModul: TestModul = {
  grup: 'Üretim modları 2–6',
  calistir() {
    const m2 = getMod('mod2');
    const m3 = getMod('mod3');
    const m4 = getMod('mod4');
    const m5 = getMod('mod5');
    const m6 = getMod('mod6');
    const plan2 = ONERILEN_PLANLAR.mod2;
    const plan3 = ONERILEN_PLANLAR.mod3;
    const plan4 = ONERILEN_PLANLAR.mod4;
    const plan5 = ONERILEN_PLANLAR.mod5;
    const plan6 = ONERILEN_PLANLAR.mod6;
    return [
      test('Mod 1', 'Önerilen plan kapalı (hızlı besi)', !onerilenPlanAcikMiSync('mod1')),
      test('Mod 2', 'Önerilen plan açık', onerilenPlanAcikMiSync('mod2')),
      test('Mod 2', 'Hazır ve tam', m2.hazir && m2.seviye === 'tam'),
      test(
        'Mod 2',
        'Sağlık paketi — besi + gebe',
        plan2.asi.includes('karma') &&
          plan2.asi.includes('brusella') &&
          plan2.parazit.includes('ivermektin'),
      ),
      test('Mod 2', 'aktifModaCoz mod2', aktifModaCoz('mod2') === 'mod2'),
      test('Mod 3', 'Damızlık hazır', m3.hazir && m3.seviye === 'tam'),
      test(
        'Mod 3',
        'Damızlık aşı paketi',
        plan3.asi.includes('ppr') && plan3.vitamin.includes('selen-e'),
      ),
      test('Mod 6', 'Sütçü damızlık hazır', m6.hazir && m6.href === '/(tabs)/yolculuk'),
      test('Mod 6', 'Plan damızlık ile uyumlu', plan6.asi.join() === plan3.asi.join()),
      test('Mod 4', 'Süt hazır', m4.hazir && m4.seviye === 'tam'),
      test(
        'Mod 4',
        'Süt + ORF + agalaksi',
        plan4.asi.includes('agalaksi') && plan4.asi.includes('ektima'),
      ),
      test('Mod 5', 'Kombine hazır', m5.hazir && m5.seviye === 'tam'),
      test(
        'Mod 5',
        'Süt + besi paketi',
        plan5.asi.includes('ektima') && plan5.parazit.includes('albendazol'),
      ),
      test(
        'Mod 2',
        'Takviye ile plan uyumu',
        plan2.asi.includes('karma') && plan2.parazit.includes('ivermektin'),
      ),
    ];
  },
};
