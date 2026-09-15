import {
  HIZLI_BESI_PLAN_SURUM,
  HIZLI_BESI_TAKVIM,
  HIZLI_BESI_YEM_TAKVIM,
  KARMA_RAPEL_PROGRAM_ID,
  hizliBesiPlanGun,
  planMlDozYerEtiketi,
  takviyeGorevOncelikSira,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { test, type TestModul } from '../cerceve';

export const hizliBesiModul: TestModul = {
  grup: 'Hızlı besi planı',
  calistir() {
    const ids = HIZLI_BESI_TAKVIM.map((t) => t.programId);
    const selenEtiket = planMlDozYerEtiketi('vitamin', 'selen-e') ?? '';
    const karmaEtiket = planMlDozYerEtiketi('asi', 'karma') ?? '';
    const rapelEtiket = planMlDozYerEtiketi('asi', KARMA_RAPEL_PROGRAM_ID) ?? '';
    return [
      test('Hızlı besi planı', 'Plan sürümü v13', HIZLI_BESI_PLAN_SURUM === 'v13'),
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
      test('Hızlı besi planı', 'Selen gün 0', hizliBesiPlanGun('vitamin', 'selen-e') === 0),
      test('Hızlı besi planı', 'Karma rapel gün 21', hizliBesiPlanGun('asi', KARMA_RAPEL_PROGRAM_ID) === 21),
      test(
        'Hızlı besi planı',
        'Satış ufku 90. gün tartım',
        HIZLI_BESI_TAKVIM.some((t) => t.gun === 90 && t.tip === 'tartim'),
      ),
      test(
        'Hızlı besi planı',
        '90. gün rutin İvermektin yok',
        !HIZLI_BESI_TAKVIM.some((t) => t.gun === 90 && t.programId.includes('ivermektin')),
      ),
      test(
        'Hızlı besi planı',
        '90. gün rutin Albendazol yok',
        !HIZLI_BESI_TAKVIM.some((t) => t.gun === 90 && t.programId.includes('albendazol')),
      ),
      test('Hızlı besi planı', 'Yem takvimi ayrı (≥8)', HIZLI_BESI_YEM_TAKVIM.length >= 8),
      test(
        'Hızlı besi planı',
        'Selen açıklaması kilo alımı',
        !!HIZLI_BESI_TAKVIM.find((t) => t.programId === 'selen-e')?.not.match(/kilo alımı/i),
      ),
      test(
        'Hızlı besi planı',
        'Selen etiket yer + 1/1 doz',
        selenEtiket.includes('1/1 doz') && selenEtiket.includes('boyun deri altı'),
      ),
      test(
        'Hızlı besi planı',
        'Karma 1/2 doz + SC',
        karmaEtiket.includes('1/2 doz') && karmaEtiket.includes('boyun deri altı'),
      ),
      test(
        'Hızlı besi planı',
        'Karma rapel 2/2 doz',
        rapelEtiket.includes('2/2 doz'),
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
