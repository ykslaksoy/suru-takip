import { ASI_PROGRAMI, asiDozEtiketi } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { test, type TestModul } from '../cerceve';

export const dozModul: TestModul = {
  grup: 'Doz etiketleri',
  calistir() {
    const iv = ASI_PROGRAMI.find((p) => p.id === 'ivermektin')!;
    const alb = ASI_PROGRAMI.find((p) => p.id === 'albendazol')!;
    const karma = ASI_PROGRAMI.find((p) => p.id === 'karma')!;
    const selen = VITAMIN_PROGRAMI.find((v) => v.id === 'selen-e')!;

    return [
      test('Doz etiketleri', 'İvermektin 0,2 ml / 10 kg', asiDozEtiketi(iv).includes('0,2 ml / 10 kg')),
      test('Doz etiketleri', 'Albendazol 1 hap / 10 kg', asiDozEtiketi(alb).includes('1 hap / 10 kg')),
      test('Doz etiketleri', 'Karma sabit 2 ml', asiDozEtiketi(karma) === 'sabit 2 ml'),
      test(
        'Doz etiketleri',
        'Selen detay kilo alımı',
        selen.detay.includes('kilo alımı'),
      ),
      test(
        'Doz etiketleri',
        'Selen ~10 kg notu',
        (selen.dozNotu ?? '').includes('10 kg'),
      ),
      test(
        'Doz etiketleri',
        'Karma koruma açıklama önce',
        karma.koruma.includes('Klostridiyal'),
      ),
    ];
  },
};
