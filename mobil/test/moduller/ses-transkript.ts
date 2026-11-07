import { test, type TestModul } from '../cerceve';
import { komutOnizle, komutOnizlemeSatirlari } from '@/kaynak/ses/komut-onizleme';
import { sttGuncelSatir, sttSonucSatirlari } from '@/kaynak/ses/stt-sonuc';

export const sesTranskriptModul: TestModul = {
  grup: 'Ses transkript / önizleme (t268u)',
  calistir: () => {
    const g = 'Ses transkript';
    const results = {
      length: 2,
      0: { isFinal: false, 0: { transcript: 'küpe' } },
      1: { isFinal: true, 0: { transcript: 'küpe 1234 68 kilo' } },
    };
    const ara = sttGuncelSatir(results, 0);
    const kesin = sttGuncelSatir(results, 1);
    const o = komutOnizle('küpe 1234, 68 kilo');

    return [
      test(g, 'ara transkript kesin değil', ara?.kesin === false && ara.metin === 'küpe'),
      test(g, 'kesin transkript', kesin?.kesin === true && kesin.metin.includes('1234')),
      test(g, 'satır listesi', sttSonucSatirlari(results).length === 2),
      test(g, 'önizleme tartım alanları', o?.islem === 'Tartım' && o.deger.includes('kg')),
      test(
        g,
        'onaylı eylem satırları',
        komutOnizlemeSatirlari({
          tur: 'asi',
          kupeArama: '1234',
          asiAdi: 'çiçek',
        }).deger === 'çiçek',
      ),
      test(g, 'stok örneği parse', komutOnizle('stok giriş yem 50 kg')?.islem.includes('Stok') === true),
    ];
  },
};
