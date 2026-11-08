import { test, type TestModul } from '../cerceve';
import { hesaplaButceMutabakat, ornekButce12000, ornekButce12500 } from '@/kaynak/maliyet/besi-plan-butce-hesap';
import type { BesiPlanDonemGirdi } from '@/kaynak/maliyet/besi-plan-tipler';

const g = 'Besi plan bütçe mutabakat';

const plan60: BesiPlanDonemGirdi[] = [
  { id: 'a', tur: 'varis_gozlem', gun: 3, gcaaGramGun: 0, gunlukYemKgBas: 0.5, yemFiyatKg: 10, gunlukBakimBas: 0 },
  { id: 'b', tur: 'uyum', gun: 5, gcaaGramGun: 0, gunlukYemKgBas: 0.8, yemFiyatKg: 10, gunlukBakimBas: 0 },
  { id: 'c', tur: 'buyume', gun: 52, gcaaGramGun: 200, gunlukYemKgBas: 1.2, yemFiyatKg: 12, gunlukBakimBas: 0 },
];

export const besiPlanButceModul: TestModul = {
  grup: g,
  calistir() {
    const o120 = hesaplaButceMutabakat(ornekButce12000(), 1);
    const o125 = hesaplaButceMutabakat(ornekButce12500(), 1);
    const o120Plan = hesaplaButceMutabakat(ornekButce12000(), 1, undefined, { girisKg: 25, donemler: plan60 });
    const beklenenYem = 3 * 0.5 * 10 + 5 * 0.8 * 10 + 52 * 1.2 * 12;

    return [
      test(g, 'Eski tablo 13580', o120.listelenenToplam === 13580),
      test(g, 'Fark 920 açık', o120.aciklanmamisFark === 920),
      test(g, 'Eski denge 3420', o120.isletmeOncesiDenge === 3420),
      test(g, 'Yeni toplam plan yok → null', o120.yeniKarsilastirmaToplam === null),
      test(g, 'Yem taslakları hariç', o120.taslakDisiKalemler.length >= 3),
      test(g, 'Plan yem 60g', o120Plan.planYemMaliyetBas === Math.round(beklenenYem)),
      test(g, 'Yeni toplam 12000+150+yem', o120Plan.yeniKarsilastirmaToplam === 12000 + 150 + Math.round(beklenenYem)),
      test(g, 'Yeni denge satış-yeni', o120Plan.yeniKarsilastirmaDenge === 17000 - o120Plan.yeniKarsilastirmaToplam!),
      test(g, '12500 eski tablo 14080', o125.listelenenToplam === 14080),
      test(g, 'Ortak dönem eksik', o120.ortakEksik.some((e) => e.includes('dönemi bilinmiyor'))),
      test(g, 'Yatırım faz1 kapalı', o120.yatirimFaz1 === 0),
      test(g, '920 uydurma yok', !o120.farkAciklama?.includes('diğer maliyet eklendi')),
    ];
  },
};
