import { test, type TestModul } from '../cerceve';
import { hesaplaButceMutabakat, ornekButce12000, ornekButce12500 } from '@/kaynak/maliyet/besi-plan-butce-hesap';

const g = 'Besi plan bütçe mutabakat';

export const besiPlanButceModul: TestModul = {
  grup: g,
  calistir() {
    const o120 = hesaplaButceMutabakat(ornekButce12000(), 1);
    const o125 = hesaplaButceMutabakat(ornekButce12500(), 1);

    return [
      test(g, 'Listelenen 13580', o120.listelenenToplam === 13580),
      test(g, 'Fark 920 açık', o120.aciklanmamisFark === 920),
      test(g, 'Denge 3420', o120.isletmeOncesiDenge === 3420),
      test(g, '12500 listelenen 14080', o125.listelenenToplam === 14080),
      test(g, '12500 denge 2920', o125.isletmeOncesiDenge === 2920),
      test(g, 'Ortak dönem eksik', o120.ortakEksik.some((e) => e.includes('dönemi bilinmiyor'))),
      test(g, 'Yatırım faz1 kapalı', o120.yatirimFaz1 === 0),
      test(g, '920 uydurma yok', !o120.farkAciklama?.includes('diğer maliyet eklendi')),
    ];
  },
};
