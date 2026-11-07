import { adgHesapla } from '@/kaynak/kilo/adg';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import {
  bireyselFcrOrtalamasiYaniltici,
  ortalamaFcrOranlari,
  padokFcrBirlestir,
  padokGcaaOzetHesapla,
  padokToplamArtisKg,
  suruFcrBirlestir,
} from '@/kaynak/kilo/padok-performans-analitik';
import { calculateFCR } from '@/kaynak/kilo/fcr';
import { test, type TestModul } from '../cerceve';

const w = (id: string, kg: number, at: string, animalId = 'a1'): WeightRecord => ({
  id,
  animalId,
  weightKg: kg,
  recordedAt: at,
  notes: '',
});

export const analitikPadokFcrModul: TestModul = {
  grup: 'Padok FCR analitiği',
  calistir() {
    const g = 'Padok FCR analitiği';

    const birlestir = padokFcrBirlestir({
      toplamYemKg: 500,
      toplamArtisKg: 100,
      olculenArtisHayvan: 2,
      padokBasSayisi: 2,
      donemGun: 30,
    });
    const yaniltici = bireyselFcrOrtalamasiYaniltici([10, 2], 200, 60);
    const ortOran = ortalamaFcrOranlari([10, 2]);
    const toplamFcr = calculateFCR(200, 60);

    const adgA = adgHesapla([w('1', 40, '2025-01-01', 'a1'), w('2', 46, '2025-01-31', 'a1')]);
    const adgB = adgHesapla([w('3', 40, '2025-01-01', 'a2'), w('4', 48, '2025-01-31', 'a2')]);
    const adgTek = adgHesapla([w('5', 40, '2025-01-01', 'a3')]);
    const gcaaOzet = padokGcaaOzetHesapla([
      { animalId: 'a1', adg: adgA, maxDays: 30 },
      { animalId: 'a2', adg: adgB, maxDays: 30 },
      { animalId: 'a3', adg: adgTek, maxDays: 30 },
    ]);

    const eksikKapsam = padokFcrBirlestir({
      toplamYemKg: 300,
      toplamArtisKg: 20,
      olculenArtisHayvan: 1,
      padokBasSayisi: 3,
      donemGun: 30,
    });

    const suru = suruFcrBirlestir([
      { toplamYemKg: 60, artisKg: 6 },
      { toplamYemKg: 90, artisKg: 9 },
    ]);

    const artis = padokToplamArtisKg([
      {
        animalId: 'a1',
        gcaaGram: 200,
        donem: {
          gainKg: 6,
          periodDays: 30,
          startWeightKg: 40,
          endWeightKg: 46,
          startAt: '2025-01-01',
          endAt: '2025-01-31',
        },
      },
    ]);

    return [
      test(g, 'Padok FCR toplam = yem/artış', birlestir.fcr === 5),
      test(g, 'Ortalama oran ≠ toplam FCR', yaniltici && ortOran === 6 && Math.abs((toplamFcr ?? 0) - 3.33) < 0.02),
      test(g, 'GCAA ölçülen/eligible', gcaaOzet.olculenSayisi === 2 && gcaaOzet.uygunSayisi === 3),
      test(g, 'Eksik kapsam uyarısı', eksikKapsam.uyari?.includes('3 baş') === true),
      test(g, 'Sürü birleştirilmiş FCR', suru.fcr === 10 && suru.olculenSayisi === 2),
      test(g, 'Toplam artış toplama', artis === 6),
      test(g, 'Sıfır artış FCR yok', padokFcrBirlestir({
        toplamYemKg: 10,
        toplamArtisKg: 0,
        olculenArtisHayvan: 0,
        padokBasSayisi: 1,
        donemGun: 30,
      }).fcr == null),
    ];
  },
};
