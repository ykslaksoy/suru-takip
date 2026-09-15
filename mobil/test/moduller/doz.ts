import { ASI_PROGRAMI, asiDozEtiketi, asiMlDozYerEtiketi } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { test, type TestModul } from '../cerceve';

export const dozModul: TestModul = {
  grup: 'Doz etiketleri',
  calistir() {
    const iv = ASI_PROGRAMI.find((p) => p.id === 'ivermektin')!;
    const alb = ASI_PROGRAMI.find((p) => p.id === 'albendazol')!;
    const karma = ASI_PROGRAMI.find((p) => p.id === 'karma')!;
    const selen = VITAMIN_PROGRAMI.find((v) => v.id === 'selen-e')!;
    const ivTam = asiMlDozYerEtiketi(iv, { dozNo: 1, toplamDoz: 1 });
    const karmaTam = asiMlDozYerEtiketi(karma, { dozNo: 1, toplamDoz: 2 });

    return [
      test(
        'Doz etiketleri',
        'İvermektin her 10 kiloya 0,2 ml',
        asiDozEtiketi(iv).includes('Her 10 kiloya 0,2 ml'),
      ),
      test(
        'Doz etiketleri',
        'Albendazol her 10 kiloya 1 hap',
        asiDozEtiketi(alb).includes('Her 10 kiloya 1 hap'),
      ),
      test('Doz etiketleri', 'Karma her kuzuya 2 ml', asiDozEtiketi(karma) === 'Her kuzuya 2 ml'),
      test(
        'Doz etiketleri',
        'Selen detay kilo alımı',
        selen.detay.includes('kilo alımı'),
      ),
      test(
        'Doz etiketleri',
        'Selen her kuzuya 1 ml',
        vitaminDozEtiketi(selen) === 'Her kuzuya 1 ml',
      ),
      test(
        'Doz etiketleri',
        'Selen uygulama yeri deri altı',
        (selen.uygulamaYeri ?? '').includes('deri altı') && !(selen.uygulamaYeri ?? '').includes('SC'),
      ),
      test(
        'Doz etiketleri',
        'Karma koruma açıklama önce',
        karma.koruma.includes('Klostridiyal'),
      ),
      test(
        'Doz etiketleri',
        'İvermektin yer lab jargonu yok',
        ivTam.includes('boyun deri altı') &&
          !ivTam.includes('%1') &&
          !ivTam.includes('etiket') &&
          !ivTam.includes('(SC)'),
      ),
      test(
        'Doz etiketleri',
        'Albendazol tablet/etiket yok',
        !asiMlDozYerEtiketi(alb).includes('etiket') &&
          !asiMlDozYerEtiketi(alb).includes('tablet') &&
          !asiMlDozYerEtiketi(alb).includes('oral'),
      ),
      test(
        'Doz etiketleri',
        'Karma 1. doz (2’den) · yer',
        karmaTam.includes('1. doz (2’den)') &&
          karmaTam.includes('boyun deri altı') &&
          !karmaTam.includes('sabit') &&
          !karmaTam.includes('(SC)'),
      ),
    ];
  },
};
