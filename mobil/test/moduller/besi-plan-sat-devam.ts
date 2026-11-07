import { hesaplaSatDevam } from '@/kaynak/maliyet/sat-devam-hesap';
import { hesaplaBesiPlanProjeksiyon, besiPlanDonemToplamGun } from '@/kaynak/maliyet/besi-plan-hesap';
import type { BesiPlanDonemGirdi } from '@/kaynak/maliyet/besi-plan-tipler';
import { test, type TestModul } from '../cerceve';

const donemTam: BesiPlanDonemGirdi[] = [
  { id: '1', tur: 'varis_gozlem', gun: 3, gcaaGramGun: 0, gunlukYemKgBas: 0.5, yemFiyatKg: 10, gunlukBakimBas: 2 },
  { id: '2', tur: 'uyum', gun: 5, gcaaGramGun: 0, gunlukYemKgBas: 1, yemFiyatKg: 10, gunlukBakimBas: 3 },
  { id: '3', tur: 'buyume', gun: 30, gcaaGramGun: 250, gunlukYemKgBas: 1.2, yemFiyatKg: 10, gunlukBakimBas: 4 },
  { id: '4', tur: 'bitirme', gun: 10, gcaaGramGun: 180, gunlukYemKgBas: 1.5, yemFiyatKg: 10, gunlukBakimBas: 5 },
];

export const besiPlanSatDevamModul: TestModul = {
  grup: 'Besi plan + sat/devam',
  calistir() {
    const g = 'Besi plan + sat/devam';

    const eksik = hesaplaSatDevam({
      canliKg: 40,
      kiloKaynagi: 'olculmus',
      satisBirimi: 'canli_kg',
      satisFiyatKg: 100,
      karkasVerim: null,
      paraBirimi: 'TRY',
      ekGun: 30,
      gunlukArtisKg: 0.25,
      gunlukEkYemKgBas: 1.2,
      yemFiyatKg: 10,
      gunlukBakimBas: null,
      batikMaliyetBas: 5000,
    });

    const hazirGirdi = () => ({
      canliKg: 40,
      kiloKaynagi: 'olculmus' as const,
      satisBirimi: 'canli_kg' as const,
      satisFiyatKg: 100,
      karkasVerim: null,
      paraBirimi: 'TRY' as const,
      ekGun: 30,
      gunlukArtisKg: 0.25,
      gunlukEkYemKgBas: 1.2,
      yemFiyatKg: 10,
      gunlukBakimBas: 5,
      batikMaliyetBas: 5000,
    });

    const hazir = hesaplaSatDevam({
      ...hazirGirdi(),
    });

    const plan = hesaplaBesiPlanProjeksiyon({ girisKg: 30, basSayisi: 10, donemler: donemTam });
    const planEksik = hesaplaBesiPlanProjeksiyon({ girisKg: null, basSayisi: 10, donemler: donemTam });

    const depo = JSON.parse(
      JSON.stringify({ surum: 1, senaryolar: [{ id: 'a', surum: 2, durum: 'taslak', baslik: 't', kapsam: { tur: 'genel', etiket: 'g' }, basSayisi: 1, girisKg: 30, girisTarih: null, alisBasFiyat: null, hedefCanliKg: null, hedefGun: null, donemler: donemTam, olusturma: '', guncelleme: '' }] }),
    ) as { senaryolar: { surum: number }[] };

    return [
      test(g, 'Sat/devam eksik bakım', eksik.durum === 'eksik'),
      test(g, 'Marjinal hesap', hazir.durum === 'hazir' && hazir.marjinalFark === hazir.gelecekNet - hazir.simdiNet),
      test(
        g,
        'Batık marjinali değiştirmez',
        hazir.durum === 'hazir' &&
          hesaplaSatDevam({ ...hazirGirdi(), batikMaliyetBas: 0 }).marjinalFark === hazir.marjinalFark,
      ),
      test(g, 'Başabaş fiyat', hazir.durum === 'hazir' && (hazir.basabasGelecekFiyatKg ?? 0) > 0),
      test(g, 'Plan FCR birleşik', plan.durum === 'hazir' && (plan.birlesikFcr ?? 0) > 0),
      test(g, 'Plan eksik giriş', planEksik.durum === 'eksik'),
      test(g, 'Dönem gün toplamı', besiPlanDonemToplamGun(donemTam) === 48),
      test(g, 'Plan depo sürüm', depo.senaryolar[0]?.surum === 2),
      test(
        g,
        'Karkas birimi',
        hesaplaSatDevam({
          canliKg: 50,
          kiloKaynagi: 'girilen',
          satisBirimi: 'karkas_kg',
          satisFiyatKg: 400,
          karkasVerim: 0.5,
          paraBirimi: 'TRY',
          ekGun: 10,
          gunlukArtisKg: 0.2,
          gunlukEkYemKgBas: 1,
          yemFiyatKg: 12,
          gunlukBakimBas: 3,
          batikMaliyetBas: null,
        }).durum === 'hazir',
      ),
    ];
  },
};
