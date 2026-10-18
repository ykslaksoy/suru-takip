import { test, type TestModul } from '../cerceve';
import { analizOzeti, gunlukArtisGram, hedefeKalanGun, referansKg, tartimAnaliz, VARSAYILAN_TARTIM_AYAR as A } from '@/kaynak/kilo/hizli-tartim';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

const w = (kg: number, at: string): WeightRecord => ({ id: at, animalId: 'k', weightKg: kg, recordedAt: at, notes: '' });

export const hizliTartimModul: TestModul = {
  grup: 'Hızlı tartım',
  calistir: () => {
    const g = 'Hızlı tartım';
    const kayit = [w(20, '2026-09-19T08:00:00Z'), w(25, '2026-10-09T08:00:00Z')];
    const a = tartimAnaliz(kayit, { kg: 27.5, at: '2026-10-19T08:00:00Z' }, A);
    const zayif = tartimAnaliz(kayit, { kg: 24, at: '2026-10-19T08:00:00Z' }, A);
    return [
      test(g, 'günlük artış 10 günde 5 kg = 500 g', gunlukArtisGram({ kg: 20, at: '2026-10-01' }, { kg: 25, at: '2026-10-11' }) === 500),
      test(g, 'aynı gün artış hesaplanmaz', gunlukArtisGram({ kg: 20, at: '2026-10-01T08:00:00Z' }, { kg: 21, at: '2026-10-01T10:00:00Z' }) === null),
      test(g, 'hedefe kalan gün', hedefeKalanGun(35, 250, 45) === 40),
      test(g, 'hedefe ulaştıysa 0', hedefeKalanGun(46, 100, 45) === 0),
      test(g, 'artış yoksa tahmin yok', hedefeKalanGun(30, 0, 45) === null),
      test(g, 'referans eğri ilk tartımdan', referansKg(kayit, '2026-10-19T08:00:00Z', A) === 27.5),
      test(g, 'anlık analiz artış', a.adgGram === 250 && a.farkKg === 2.5 && a.hedefeGun === 70, JSON.stringify(a)),
      test(g, 'eğri üstü işaretlenmez', !a.egriAltinda),
      test(g, 'eğri altı işaretlenir', zayif.egriAltinda, JSON.stringify(zayif)),
      test(g, 'özet metni', analizOzeti(zayif, A).includes('eğrinin altında')),
      test(g, 'ilk tartım özeti', analizOzeti(tartimAnaliz([], { kg: 20, at: '2026-10-19' }, A), A).startsWith('ilk tartım')),
    ];
  },
};
