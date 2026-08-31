import {
  HIZLI_BESI_PLAN_SURUM,
  HIZLI_BESI_TAKVIM,
  KARMA_RAPEL_PROGRAM_ID,
  hizliBesiPlanGun,
  takviyeGorevOncelikSira,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { test, type TestModul } from '../cerceve';

export const hizliBesiModul: TestModul = {
  grup: 'Hızlı besi planı',
  calistir() {
    const ids = HIZLI_BESI_TAKVIM.map((t) => t.programId);
    return [
      test('Hızlı besi planı', 'Plan sürümü v11', HIZLI_BESI_PLAN_SURUM === 'v11'),
      test('Hızlı besi planı', 'Enterotoksemi planda yok', !ids.includes('enterotoksemi')),
      test(
        'Hızlı besi planı',
        'Enterotoksemi rapel planda yok',
        !ids.includes('enterotoksemi-rapel'),
      ),
      test('Hızlı besi planı', 'Karma giriş var', ids.includes('karma')),
      test('Hızlı besi planı', 'Karma rapel var', ids.includes(KARMA_RAPEL_PROGRAM_ID)),
      test('Hızlı besi planı', 'T1 tartım var', ids.includes('tartim-giris')),
      test('Hızlı besi planı', '15g tartım var', ids.includes('tartim-15')),
      test('Hızlı besi planı', 'Selen gün 7', hizliBesiPlanGun('vitamin', 'selen-e') === 7),
      test('Hızlı besi planı', 'Karma rapel gün 21', hizliBesiPlanGun('asi', KARMA_RAPEL_PROGRAM_ID) === 21),
      test(
        'Hızlı besi planı',
        'Selen açıklaması kilo alımı',
        !!HIZLI_BESI_TAKVIM.find((t) => t.programId === 'selen-e')?.not.match(/kilo alımı/i),
      ),
      test(
        'Hızlı besi planı',
        'Parazit önceliği karma’dan önce',
        takviyeGorevOncelikSira('parazit', 'ivermektin') <
          takviyeGorevOncelikSira('asi', 'karma'),
      ),
      test(
        'Hızlı besi planı',
        '15g tartım rapelden önce (aynı gün sırası)',
        takviyeGorevOncelikSira('tartim', 'tartim-15') <
          takviyeGorevOncelikSira('asi', KARMA_RAPEL_PROGRAM_ID),
      ),
    ];
  },
};
