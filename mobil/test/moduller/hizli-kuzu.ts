import { test, type TestModul } from '../cerceve';
import {
  aralikAdet,
  aralikEtiketleri,
  kupeAralikAyikla,
  onekMaxNumara,
  otomatikKupeSerisi,
} from '../../kaynak/suru/kupe-aralik';

export const hizliKuzuModul: TestModul = {
  grup: 'Hızlı kuzu kabul',
  calistir() {
    const a = kupeAralikAyikla('1001–1010', 'TR-');
    const b = kupeAralikAyikla('TR-34-001–TR-34-003');
    const etiketler = a ? aralikEtiketleri(a) : [];
    const max = onekMaxNumara(
      ['TR-34-001234', 'TR-34-001235', 'TR-10010060', 'SY-0001'],
      'TR-1001',
    );
    const autoBos = otomatikKupeSerisi({
      onek: 'TR-1001',
      adet: 3,
      mevcutEarTags: ['TR-34-001234', 'TR-34-001235'],
    });
    const autoDevam = otomatikKupeSerisi({
      onek: 'TR-1001',
      adet: 2,
      mevcutEarTags: ['TR-10010060', 'TR-10010059'],
    });
    const autoElle = otomatikKupeSerisi({
      onek: 'TR-1001',
      adet: 2,
      mevcutEarTags: ['TR-10010060'],
      baslangic: 61,
    });
    return [
      test('Hızlı kuzu', 'kısa aralık ayıkla', !!a && a.baslangic === 1001 && a.bitis === 1010),
      test('Hızlı kuzu', 'kısa aralık adet 10', !!a && aralikAdet(a) === 10),
      test('Hızlı kuzu', 'öneki TR- uygula', etiketler[0] === 'TR-1001' && etiketler[9] === 'TR-1010'),
      test(
        'Hızlı kuzu',
        'tam küpe aralığı',
        !!b && b.onek === 'TR-34-' && b.baslangic === 1 && b.bitis === 3 && aralikAdet(b) === 3,
      ),
      test('Hızlı kuzu', 'geçersiz metin null', kupeAralikAyikla('abc') === null),
      test('Hızlı kuzu', 'önek max TR-1001 → 60', max.max === 60),
      test(
        'Hızlı kuzu',
        'otomatik boş önek 1’den',
        autoBos.baslangic === 1 && autoBos.etiketler[0] === 'TR-10010001',
      ),
      test(
        'Hızlı kuzu',
        'otomatik sürü toplamı değil max+1',
        autoDevam.baslangic === 61 && autoDevam.etiketler[0] === 'TR-10010061',
      ),
      test(
        'Hızlı kuzu',
        'elle başlangıç 61',
        autoElle.baslangic === 61 && autoElle.etiketler[0] === 'TR-10010061',
      ),
    ];
  },
};
