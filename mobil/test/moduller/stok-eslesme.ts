import { test, type TestModul } from '../cerceve';
import { dusukStokMu, dusumMiktari, stokKalemiEslestir } from '@/kaynak/stok/eslesme';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

const s = (id: string, name: string, type: StockItem['type'], quantity = 10, minQuantity = 5): StockItem =>
  ({ id, name, type, quantity, unit: 'doz', minQuantity, expiryDate: null, notes: '' });
const L = [s('1', 'Arpa', 'feed'), s('2', 'İvermektin %1', 'medicine'), s('3', 'Çiçek aşısı', 'vaccine', 3), s('4', 'Karma aşı (Clostridial)', 'vaccine')];

export const stokEslesmeModul: TestModul = {
  grup: 'Stok eşleşme',
  calistir: () => {
    const g = 'Stok';
    return [
      test(g, 'ivermektin eşleşir', stokKalemiEslestir('ivermektin', L)?.id === '2'),
      test(g, 'Türkçe karakter: cicek → Çiçek aşısı', stokKalemiEslestir('cicek asisi', L)?.id === '3'),
      test(g, 'yem kalemine ilaç düşmez', stokKalemiEslestir('arpa', L) === null),
      test(g, 'eşleşme yoksa null', stokKalemiEslestir('penisilin', L) === null),
      test(g, 'düşük stok', dusukStokMu(L[2]) && !dusukStokMu(L[1])),
      test(g, 'doz × hayvan', dusumMiktari(2, 10, 50).dus === 20),
      test(g, 'stok yetmezse eksik bildirir', (() => { const r = dusumMiktari(1, 10, 4); return r.dus === 4 && r.eksik === 6; })()),
    ];
  },
};
