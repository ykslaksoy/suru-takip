import { test, type TestModul } from '../cerceve';
import { HAZIR_RASYONLAR } from '@/kaynak/rasyon/formul';
import {
  isimdenTamYemCikarimYasak,
  rasyonCiftSayimRiski,
  stokKaynagaUygun,
  tamYemOlarakSayilir,
  ticariYemMi,
  uretimBilesenMi,
  yemAnalizOzeti,
  yemStokMeta,
} from '@/kaynak/yem/yem-kaynagi';
import { gozlemBeslemeBaglam } from '@/kaynak/yem/gozlem-besleme';

const ticari = { id: 't1', name: 'Kuzu yemi X', notes: 'fabrika-kuzu · ticari', unit: 'kg', quantity: 100 };
const uretim = { id: 'u1', name: 'Arpa', notes: 'uretim-bilesen', unit: 'kg', quantity: 50 };

export const rasyonYemKaynagiModul: TestModul = {
  grup: 'Rasyon · yem kaynağı',
  calistir() {
    const fazSablon = HAZIR_RASYONLAR.find((h) => h.id === 'besi-baslangic')!;
    const gozlemBag = gozlemBeslemeBaglam('Gözlem', { not: 'Yeni kabul', karantina: true });

    return [
      test('Yem kaynağı', 'Ticari stok meta', yemStokMeta(ticari).kaynak === 'ticari'),
      test('Yem kaynağı', 'Üretim stok meta', yemStokMeta(uretim).kaynak === 'uretim'),
      test('Yem kaynağı', 'Başlangıç adı tam yem kanıtı değil', isimdenTamYemCikarimYasak('Besi başlangıç yemi')),
      test('Yem kaynağı', 'Tam yem yalnız etiket beyanı', !tamYemOlarakSayilir(ticari) && tamYemOlarakSayilir({ ...ticari, notes: 'ticari · tam:evet' })),
      test('Yem kaynağı', 'Faz şablon ≠ ticari starter', fazSablon.ad.includes('Erken') && fazSablon.aciklama.includes('ticari starter değildir')),
      test('Yem kaynağı', 'Üretim tercihinde ticari filtre', !stokKaynagaUygun(ticari, 'uretim') && stokKaynagaUygun(uretim, 'uretim')),
      test('Yem kaynağı', 'Analiz eksik uyarısı', yemAnalizOzeti(uretim).eksik.length > 0),
      test('Yem kaynağı', 'Çift sayım riski', Boolean(rasyonCiftSayimRiski(
        [{ stockId: 't1', kgBasGun: 1 }, { stockId: 'u1', kgBasGun: 0.2 }],
        [{ ...ticari, notes: 'ticari · tam:evet' }, uretim],
      ))),
      test('Yem kaynağı', 'Ticari / üretim sınıfı', ticariYemMi(ticari) && uretimBilesenMi(uretim)),
      test('Yem kaynağı', 'Gözlem otomatik öneri yok', gozlemBag.otomatikOneriYok),
      test('Yem kaynağı', 'Gözlem bağlam uyarı', Boolean(gozlemBag.uyari)),
    ];
  },
};
