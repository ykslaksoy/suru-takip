import { test, type TestModul } from '../cerceve';
import {
  aralikAdet,
  aralikEtiketleri,
  kupeAralikAyikla,
  onekMaxNumara,
  onerilenBaslangicNo,
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
      toplamHayvan: 0,
    });
    const autoDevam = otomatikKupeSerisi({
      onek: 'TR-1001',
      adet: 2,
      mevcutEarTags: ['TR-10010060', 'TR-10010059'],
      toplamHayvan: 60,
    });
    const autoElle = otomatikKupeSerisi({
      onek: 'TR-1001',
      adet: 2,
      mevcutEarTags: ['TR-10010060'],
      baslangic: 61,
    });
    const padokTags = [
      'TR-34-200001',
      'TR-34-200020',
      'TR-34-300001',
      'TR-34-400020',
    ];
    const oneri60 = onerilenBaslangicNo(padokTags, 'TR-', 60);
    const autoPadok = otomatikKupeSerisi({
      onek: 'TR-',
      adet: 1,
      mevcutEarTags: padokTags,
      toplamHayvan: 60,
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
        'otomatik boş önek+sıfır sürü 1’den',
        autoBos.baslangic === 1 && autoBos.etiketler[0] === 'TR-10010001',
      ),
      test(
        'Hızlı kuzu',
        'otomatik max+1 / sürü+1 → 61',
        autoDevam.baslangic === 61 && autoDevam.etiketler[0] === 'TR-10010061',
      ),
      test(
        'Hızlı kuzu',
        'elle başlangıç 61',
        autoElle.baslangic === 61 && autoElle.etiketler[0] === 'TR-10010061',
      ),
      test('Hızlı kuzu', '60 padok + TR- önek → öneri 61', oneri60 === 61),
      test(
        'Hızlı kuzu',
        'padok etiketleriyle otomatik 61',
        autoPadok.baslangic === 61 && autoPadok.etiketler[0] === 'TR-0061',
      ),
    ];
  },
};
