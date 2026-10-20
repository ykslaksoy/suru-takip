import { test, type TestModul } from '../cerceve';
import { nottanAlisFiyati, partiMaliyetleri } from '@/kaynak/maliyet/hesap';
import type { Animal, StockItem, StockMovement } from '@/kaynak/cekirdek/tipler';

const a = (id: string, paddock: string, notes = '', status: Animal['status'] = 'healthy'): Animal => ({
  id, earTag: `TR-${id}`, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock, status,
  motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes, createdAt: '', updatedAt: '', syncStatus: 'synced',
});
const it = (id: string, type: StockItem['type']): StockItem => ({ id, name: id, type, quantity: 0, unit: 'kg', minQuantity: 0, expiryDate: null, notes: '' });
const mv = (stockId: string, quantity: number, notes = ''): StockMovement => ({ id: `${stockId}${quantity}${notes}`, stockId, movementType: 'out', quantity, recordedAt: '', notes });

export const maliyetModul: TestModul = {
  grup: 'Maliyet ve kâr',
  calistir: () => {
    const g = 'Maliyet';
    const animals = [a('1', 'Padok A', 'Alım 10.000 ₺'), a('2', 'Padok A', 'Alım 12.000 ₺'), a('3', 'Padok B'), a('4', 'Padok B')];
    const r = partiMaliyetleri({
      animals,
      sonKg: { '1': 30, '2': 30, '3': 25, '4': 25 },
      items: [it('arpa', 'feed'), it('ivo', 'medicine')],
      movements: [mv('arpa', 100, 'Padok A'), mv('arpa', 100), mv('ivo', 2, 'Aşı · TR-3')],
      fiyatlar: { arpa: 10, ivo: 50 },
      ayar: { partiler: { 'Padok B': { alisBasFiyat: 9000, satisKgFiyat: 400 }, 'Padok A': { gercekSatisTutar: 30000 } }, hayvanAlis: {} },
    });
    const A = r.find((x) => x.parti === 'Padok A')!;
    const B = r.find((x) => x.parti === 'Padok B')!;
    return [
      test(g, 'nottan alış fiyatı', nottanAlisFiyati('Sırt 1 · Alım 9.000 ₺ · 2 ay') === 9000),
      test(g, 'alım tartımı notu', nottanAlisFiyati('Alım tartımı · 9500 ₺') === 9500),
      test(g, 'A alış nottan', A.alis === 22000),
      test(g, 'yem: padok notu + paylaştırma', A.yem === 1500 && B.yem === 500, `${A.yem} ${B.yem}`),
      test(g, 'ilaç küpeyle partiye', B.ilac === 100 && A.ilac === 0),
      test(g, 'baş başı maliyet', A.basBasi === Math.round(23500 / 2)),
      test(g, 'kg başı maliyet', A.kgBasi === Math.round((23500 / 60) * 10) / 10),
      test(g, 'B parti alış fiyatı', B.alis === 18000),
      test(g, 'tahmini kâr = kg × ₺/kg − maliyet', B.tahminiKar === 50 * 400 - (18000 + 500 + 100)),
      test(g, 'gerçek kâr', A.gercekKar === 30000 - 23500),
    ];
  },
};
