import { test, type TestModul } from '../cerceve';
import type { StokListeSatiri } from '@/kaynak/stok';
import {
  devletProgramAsiMi,
  filtreleStokSatirlari,
  karsilastirStokSatirlari,
  siralaStokListeSatirlari,
  stoktaMiktarVar,
} from '@/kaynak/stok/asi-siralama';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

const g = 'Stok aşı sıralama';

function satir(
  partial: Partial<StokListeSatiri> & Pick<StokListeSatiri, 'key' | 'ad' | 'katalogId'>,
): StokListeSatiri {
  return {
    type: 'vaccine',
    birim: 'doz',
    minMiktar: 10,
    aciklama: partial.aciklama ?? '',
    item: null,
    kullanim: 0,
    ...partial,
  };
}

const item = (qty: number, name: string): StockItem => ({
  id: 'i1',
  name,
  type: 'vaccine',
  quantity: qty,
  unit: 'doz',
  minQuantity: 10,
  expiryDate: null,
  notes: '',
});

export const stokAsiSiralamaModul: TestModul = {
  grup: g,
  calistir() {
    const bos = [
      satir({ key: 'brusella', katalogId: 'brusella', ad: 'Brusella', aciklama: 'Devlet programı' }),
      satir({ key: 'cicek', katalogId: 'cicek', ad: 'Çiçek', aciklama: 'Devlet · destek şartı · VETBİS' }),
      satir({ key: 'ektima', katalogId: 'ektima', ad: 'Ektima (ORF)', aciklama: 'Çizik · uyluk içi' }),
      satir({ key: 'karma', katalogId: 'karma', ad: 'Karma aşı', aciklama: 'Her kuzuya 2 ml' }),
    ];

    const stokluSifirUsage = [
      ...bos.map((s) =>
        s.katalogId === 'brusella' || s.katalogId === 'cicek' || s.katalogId === 'ektima'
          ? { ...s, item: item(0, s.ad) }
          : s,
      ),
    ];

    const siralik = siralaStokListeSatirlari(stokluSifirUsage);
    const ilkUc = siralik.slice(0, 3).map((x) => x.katalogId);

    const yuksekDevlet = [
      satir({ key: 'karma', katalogId: 'karma', ad: 'Karma', aciklama: 'x', kullanim: 2 }),
      satir({ key: 'brusella', katalogId: 'brusella', ad: 'Brusella', aciklama: 'Devlet programı', kullanim: 99 }),
    ];
    const yd = siralaStokListeSatirlari(yuksekDevlet);

    const ozel = siralaStokListeSatirlari([
      satir({ key: 'karma', katalogId: 'karma', ad: 'Karma', kullanim: 1 }),
      satir({
        key: 'custom',
        katalogId: null,
        ad: 'Özel marka ORF',
        aciklama: 'Özel kalem',
        kullanim: 8,
      }),
    ]);

    const arama = filtreleStokSatirlari(bos, 'brus');
    const cmp = karsilastirStokSatirlari(
      satir({ key: 'karma', katalogId: 'karma', ad: 'Karma' }),
      satir({ key: 'ektima', katalogId: 'ektima', ad: 'Ektima' }),
    );

    return [
      test(g, 'Devlet: brusella etiketi', devletProgramAsiMi(bos[0])),
      test(g, 'Çiftlik: ektima devlet değil', !devletProgramAsiMi(bos[2])),
      test(g, 'Sıfır stok miktar var sayılmaz', !stoktaMiktarVar({ item: item(0, 'x') }) && stoktaMiktarVar({ item: item(1, 'x') })),
      test(
        g,
        'Kullanım 0 iken devlet stok kaydı alfabet öne itmez',
        ilkUc[0] === 'karma' && !devletProgramAsiMi(siralik[0]),
      ),
      test(g, 'Yüksek kullanımlı devlet yine sonda', yd[0].katalogId === 'karma' && yd[1].katalogId === 'brusella'),
      test(g, 'Özel kalem yüksek kullanım üstte', ozel[0].key === 'custom'),
      test(
        g,
        'Devlet kalemleri tek son blok',
        (() => {
          const s = siralaStokListeSatirlari(bos);
          const firstDev = s.findIndex((x) => devletProgramAsiMi(x));
          if (firstDev < 0) return false;
          return s.slice(0, firstDev).every((x) => !devletProgramAsiMi(x)) && s.slice(firstDev).every((x) => devletProgramAsiMi(x));
        })(),
      ),
      test(g, 'Arama brusella bulur', arama.length === 1 && arama[0].katalogId === 'brusella'),
      test(g, 'Katalog sırası kullanım eşitken (karma önce)', cmp < 0),
    ];
  },
};
