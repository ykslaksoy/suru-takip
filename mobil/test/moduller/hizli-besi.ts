import {
  HIZLI_BESI_PLAN_SURUM,
  HIZLI_BESI_TAKVIM,
  HIZLI_BESI_YEM_TAKVIM,
  KARMA_RAPEL_PROGRAM_ID,
  hizliBesiPlanGun,
  planMlDozYerEtiketi,
  takviyeGorevOncelikSira,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { TARTIM_GIRIS_PROGRAM_ID } from '@/kaynak/akilli-veteriner/takviye-tipler';
import { test, type TestModul } from '../cerceve';

export const hizliBesiModul: TestModul = {
  grup: 'Hızlı besi planı',
  calistir() {
    const ids = HIZLI_BESI_TAKVIM.map((t) => t.programId);
    const selenEtiket = planMlDozYerEtiketi('vitamin', 'selen-e') ?? '';
    const karmaEtiket = planMlDozYerEtiketi('asi', 'karma') ?? '';
    const rapelEtiket = planMlDozYerEtiketi('asi', KARMA_RAPEL_PROGRAM_ID) ?? '';
    const gun1Sirali = HIZLI_BESI_TAKVIM.filter((t) => t.gun === 1);
    return [
      test('Hızlı besi planı', 'Plan sürümü v14', HIZLI_BESI_PLAN_SURUM === 'v14'),
      test('Hızlı besi planı', 'Enterotoksemi planda yok', !ids.includes('enterotoksemi')),
      test(
        'Hızlı besi planı',
        'Enterotoksemi rapel planda yok',
        !ids.includes('enterotoksemi-rapel'),
      ),
      test('Hızlı besi planı', 'Karma giriş var', ids.includes('karma')),
      test('Hızlı besi planı', 'Karma rapel var', ids.includes(KARMA_RAPEL_PROGRAM_ID)),
      test('Hızlı besi planı', 'T1 tartım var', ids.includes(TARTIM_GIRIS_PROGRAM_ID)),
      test('Hızlı besi planı', '15g tartım var', ids.includes('tartim-15')),
      test('Hızlı besi planı', 'Selen gün 1', hizliBesiPlanGun('vitamin', 'selen-e') === 1),
      test('Hızlı besi planı', 'İvermektin gün 1', hizliBesiPlanGun('parazit', 'ivermektin') === 1),
      test('Hızlı besi planı', 'Karma giriş gün 1', hizliBesiPlanGun('asi', 'karma') === 1),
      test(
        'Hızlı besi planı',
        'Gün 0 aşı/iğne yok',
        !HIZLI_BESI_TAKVIM.some((t) => t.gun === 0),
      ),
      test(
        'Hızlı besi planı',
        'Gün 1 önce tartı',
        gun1Sirali[0]?.programId === TARTIM_GIRIS_PROGRAM_ID,
      ),
      test(
        'Hızlı besi planı',
        'Tartı önceliği ilaçlardan önce',
        takviyeGorevOncelikSira('tartim', TARTIM_GIRIS_PROGRAM_ID) <
          takviyeGorevOncelikSira('parazit', 'ivermektin'),
      ),
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
        'Selen etiket yer (1/1 gizli)',
        selenEtiket.includes('Her kuzuya 1 ml') &&
          selenEtiket.includes('boyun deri altı') &&
          !selenEtiket.includes('1/1') &&
          !selenEtiket.includes('(SC)'),
      ),
      test(
        'Hızlı besi planı',
        'Karma 1. doz + boyun deri altı',
        karmaEtiket.includes('1. doz (2’den)') &&
          karmaEtiket.includes('boyun deri altı') &&
          !karmaEtiket.includes('sabit') &&
          !karmaEtiket.includes('(SC)'),
      ),
      test(
        'Hızlı besi planı',
        'Karma rapel 2. doz',
        rapelEtiket.includes('2. doz (2’den)'),
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
