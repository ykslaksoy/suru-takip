import { test, type TestModul } from '../cerceve';
import {
  hazirSablonStokPlani,
  rasyonKalemleriStokDogrula,
  yemStokEsle,
} from '@/kaynak/rasyon/stok-plan';
import { gereksinim } from '@/kaynak/rasyon/formul';
import { HAZIR_RASYONLAR } from '@/kaynak/rasyon/formul';

export const rasyonStokPlanModul: TestModul = {
  grup: 'Rasyon · stok planı',
  calistir() {
    const hazir = HAZIR_RASYONLAR.find((h) => h.id === 'besi-baslangic')!;
    const g = gereksinim(30, 'lamb_fattening');
    const yalnizArpa = [{ id: 'a1', name: 'Arpa', quantity: 500 }];
    const ozet = hazirSablonStokPlani(hazir.karisim, g.yemKg, g, yalnizArpa, 20, 1);

    const esle = yemStokEsle('Mısır', [{ id: 'm', name: 'Mısır', quantity: 10 }]);

    const yetersiz = rasyonKalemleriStokDogrula(
      [{ stockId: 'a1', kgBasGun: 2 }],
      [{ id: 'a1', name: 'Arpa', quantity: 10 }],
      20,
      1,
    );

    const yeter = rasyonKalemleriStokDogrula(
      [{ stockId: 'a1', kgBasGun: 0.2 }],
      [{ id: 'a1', name: 'Arpa', quantity: 100 }],
      10,
      1,
    );

    return [
      test('Rasyon stok', 'Yalnız arpa → eksik kalemler var', ozet.eksik.length > 0 && ozet.stokta.length === 1),
      test('Rasyon stok', 'Eksik varken uygulanabilir değil', !ozet.uygulanabilir && ozet.kismiKayit),
      test('Rasyon stok', 'Stok besin kontrolü şablondan ayrı', ozet.stokKontrol != null && !ozet.stokKontrol.every((k) => k.tamam)),
      test('Rasyon stok', 'Mısır adı eşleşmesi', esle?.id === 'm'),
      test('Rasyon stok', 'Günlük stok yetersiz', !yetersiz.tamam && yetersiz.eksikler.length === 1),
      test('Rasyon stok', 'Günlük stok yeter', yeter.tamam),
      test('Rasyon stok', 'Şablon referans kontrolü dolu', ozet.referansKontrol.length >= 4),
    ];
  },
};
