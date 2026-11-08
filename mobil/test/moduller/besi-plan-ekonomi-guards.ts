import { test, type TestModul } from '../cerceve';
import { cozPlanAlisBas } from '@/kaynak/maliyet/besi-plan-alis';
import { satisGelirBasHesapla, karkasVerimOku } from '@/kaynak/maliyet/besi-plan-satis';
import { planMaliyetVeKgGunHedef, karsilastirAdaySatisGunleri } from '@/kaynak/maliyet/dongu-ekonomi-hesap';
import { ekonomiTamamlikBelirle, dengeBaslik } from '@/kaynak/maliyet/besi-plan-ekonomi-etiket';
import { BESI_DIYET_TASLAKLARI, rasyonBeslemeAktifEdilebilirMi } from '@/kaynak/maliyet/besi-taslak-diyet';
import type { BesiPlanDonemGirdi } from '@/kaynak/maliyet/besi-plan-tipler';

const g = 'Besi plan ekonomi korumaları';

const donemTam: BesiPlanDonemGirdi[] = [
  { id: 'b', tur: 'buyume', gun: 90, gcaaGramGun: 250, gunlukYemKgBas: 1.2, yemFiyatKg: 10, gunlukBakimBas: 2 },
];

export const besiPlanEkonomiGuardsModul: TestModul = {
  grup: g,
  calistir() {
    const p60 = planMaliyetVeKgGunHedef(25, donemTam, 60);
    const p90 = planMaliyetVeKgGunHedef(25, donemTam, 90);
    const karkasYok = satisGelirBasHesapla({ canliKg: 40, birim: 'karkas_kg', fiyatKg: 648, karkasVerim: null });
    const karkasVar = satisGelirBasHesapla({ canliKg: 40, birim: 'karkas_kg', fiyatKg: 100, karkasVerim: 0.5 });
    const kars = karsilastirAdaySatisGunleri({
      basSayisi: 10,
      alisBas: 12500,
      girisKg: 25,
      donemler: donemTam,
      aylikKalemler: [],
      donguSabitToplam: null,
      paylasimli: [],
      donguArasiBosGun: null,
      adayGunler: [60, 90],
      satisFiyatKg: 280,
      satisBirimi: 'canli_kg',
      karkasVerim: null,
    });
    const karkasKars = karsilastirAdaySatisGunleri({
      basSayisi: 10,
      alisBas: 12500,
      girisKg: 25,
      donemler: donemTam,
      aylikKalemler: [],
      donguSabitToplam: null,
      paylasimli: [],
      donguArasiBosGun: null,
      adayGunler: [90],
      satisFiyatKg: 648,
      satisBirimi: 'karkas_kg',
      karkasVerim: null,
    });
    const taslak = rasyonBeslemeAktifEdilebilirMi(BESI_DIYET_TASLAKLARI[7]!);

    return [
      test(g, '500×25 alış', cozPlanAlisBas({ alisBasFiyat: null, alisCanliKgFiyat: 500, girisKg: 25, gercekParti: null }).alisBas === 12500),
      test(g, 'Karkas verim yoksa gelir yok', karkasYok.gelirBas === null),
      test(g, 'Karkas verim %50', karkasVar.gelirBas === 2000),
      test(g, 'Verim oku 48,5', karkasVerimOku('48,5') === 0.485),
      test(g, '60≠90 canlı kg', p60 && p90 && p60.cikisKg < p90.cikisKg),
      test(g, 'Canlı aday', kars.satirlar.some((s) => s.gun === 60 && s.ekonomi.durum === 'hazir')),
      test(g, 'Karkas verim eksik satır', karkasKars.satirlar[0]?.ekonomi.durum === 'eksik'),
      test(g, 'Eksik yem tamamlik kismi', ekonomiTamamlikBelirle([], null, true) === 'kismi'),
      test(g, 'Denge etiketi', dengeBaslik('kismi').includes('net kâr değil')),
      test(g, 'Taslak diyet besleme kapalı', !taslak.aktif),
    ];
  },
};
