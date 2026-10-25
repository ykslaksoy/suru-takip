import { takviyeKatalogIdGecerli, takviyeKatalogMeta } from '@/kaynak/saglik/asi-katalog-meta';
import { test, type TestModul } from '../cerceve';

export const asiKatalogModul: TestModul = {
  grup: 'Aşı katalog',
  calistir() {
    const karma = takviyeKatalogMeta('karma');
    const selen = takviyeKatalogMeta('selen-e');
    return [
      test('Aşı katalog', 'karma meta', karma?.tip === 'asi' && karma.baslik.includes('Klostridiyal')),
      test('Aşı katalog', 'selen-e vitamin', selen?.tip === 'vitamin' && selen.urunAdi === 'Selenyum-E'),
      test(
        'Aşı katalog',
        'selen doz yer',
        (selen?.dozYerEtiket ?? '').includes('boyun deri altı'),
      ),
      test('Aşı katalog', 'geçersiz id', !takviyeKatalogIdGecerli('yok-boyle')),
      test('Aşı katalog', 'selen geçerli', takviyeKatalogIdGecerli('selen-e')),
    ];
  },
};
