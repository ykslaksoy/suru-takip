import { test, type TestModul } from '../cerceve';
import {
  bugunYerelIso,
  gelismisEksikAyikla,
  hatirlatmaTarihiYakala,
  parseBilgi,
  parseDogum,
  parseGozlemHatirlat,
  parsePadokTasi,
  parsePadokYem,
  parseTartimDuzelt,
} from '@/kaynak/ses/gelismis-parse';
import { komutAyikla } from '@/kaynak/ses/komut';
import { komutOnizlemeSatirlari } from '@/kaynak/ses/komut-onizleme';

export const sesGelismisKomutModul: TestModul = {
  grup: 'Ses gelişmiş komut (faz 6)',
  calistir: () => {
    const g = 'Ses faz6';
    const bugun = '2026-11-07';
    const b1 = parseBilgi('küpe 1234 son tartım kaç kilo');
    const b2 = parseBilgi('bugün aşı görevleri');
    const yem = parsePadokYem('ikinci padoka bugün 50 kilo yem verildi');
    const tasi = parsePadokTasi('küpe 1234 padok B ye taşı');
    const goz = parseGozlemHatirlat('küpe 1234 iştahsız yarın kontrol hatırlat');
    const duz = parseTartimDuzelt('küpe 1234 son tartımı düzelt 72 kilo');
    const dog = parseDogum(
      'küpe 456 ikiz doğurdu küpe 1001 erkek küpe 1002 dişi 2026-11-07',
    );

    return [
      test(g, 'bilgi son kilo', b1?.tur === 'bilgi' && b1.soru === 'son_kilo'),
      test(g, 'bilgi bugün aşı', b2?.tur === 'bilgi' && b2.soru === 'bugun_asi_ozet'),
      test(
        g,
        'padok yem gerçek tüketim',
        yem?.tur === 'padok_yem' && yem.miktarKg === 50,
        JSON.stringify(yem),
      ),
      test(g, 'padok taşı', tasi?.tur === 'padok_tasi' && tasi.padokHedef.includes('Padok')),
      test(g, 'gözlem hatırlat', goz?.tur === 'gozlem_hatirlat' && goz.hatirlatmaTarihi === '2026-11-08'),
      test(g, 'tartım düzelt', duz?.tur === 'tartim_duzelt' && duz.yeniKg === 72),
      test(g, 'doğum ikiz küpe zorunlu', dog?.tur === 'dogum' && dog.kuzular.length === 2),
      test(g, 'doğum eksik küpe mesajı', gelismisEksikAyikla('456 ikiz doğurdu')?.includes('küpe')),
      test(g, 'hatırlatma tarihsiz', gelismisEksikAyikla('1234 iştahsız kontrol hatırlat')?.includes('tarih')),
      test(g, 'yarın tarihi', hatirlatmaTarihiYakala('yarın kontrol', bugun) === '2026-11-08'),
      test(g, 'bugün iso', bugunYerelIso(new Date('2026-11-07T10:00:00')) === '2026-11-07'),
      test(
        g,
        'entegre ayıkla düzeltme',
        komutAyikla('küpe 99 tartımı düzelt 80 kilo')?.tur === 'tartim_duzelt',
      ),
      test(
        g,
        'önizleme padok yem',
        komutOnizlemeSatirlari({
          tur: 'padok_yem',
          padokHam: '2',
          miktarKg: 50,
          tarih: bugun,
        }).islem.includes('Gerçek'),
      ),
    ];
  },
};
