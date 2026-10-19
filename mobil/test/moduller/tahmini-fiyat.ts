import { test, type TestModul } from '../cerceve';
import { partiMaliyetleri } from '@/kaynak/maliyet/hesap';
import {
  alisTahmini,
  birimCevir,
  birimFiyatCoz,
  etkinFiyatlar,
  fiyatMetniOku,
  oneriMetni,
  referansBul,
} from '@/kaynak/maliyet/tahmini-fiyat';
import { CANLI_KUZU_KG, FIYAT_EKSIK, FIYAT_REFERANS } from '@/kaynak/maliyet/fiyat-referans';
import { ASI_KATALOGU } from '@/kaynak/stok/katalog';
import type { Animal, StockItem, StockMovement } from '@/kaynak/cekirdek/tipler';

const G = 'Tahmini fiyat';
const it = (id: string, name: string, unit: string, type: StockItem['type'] = 'feed'): StockItem => ({
  id, name, type, quantity: 0, unit, minQuantity: 0, expiryDate: null, notes: '',
});
const a = (id: string, paddock: string): Animal => ({
  id, earTag: `TR-${id}`, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock, status: 'healthy',
  motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '', createdAt: '', updatedAt: '', syncStatus: 'synced',
});
const mv = (stockId: string, quantity: number): StockMovement => ({ id: `${stockId}${quantity}`, stockId, movementType: 'out', quantity, recordedAt: '', notes: '' });

export const tahminiFiyatModul: TestModul = {
  grup: G,
  calistir: () => {
    const arpa = it('s1', 'Arpa kırması', 'kg');
    const arpaTon = it('s2', 'Arpa kırması', 'ton');
    const ivo = it('s3', 'İvermektin', 'ml', 'medicine');
    const cicek = it('s4', 'Çiçek', 'doz', 'vaccine');
    const cuval = it('s5', 'Arpa kırması', 'çuval');
    const refArpa = referansBul('Arpa kırması')!;

    const gercekVar = birimFiyatCoz(arpa, { s1: 12 });
    const tahmini = birimFiyatCoz(arpa, {});
    const yok = birimFiyatCoz(ivo, {});
    const { fiyatlar, durumlar } = etkinFiyatlar([arpa, ivo, cicek], { s4: 20 });

    const r = partiMaliyetleri({
      animals: [a('1', 'Padok A'), a('2', 'Padok A')],
      sonKg: { '1': 30, '2': 30 },
      items: [arpa, ivo],
      movements: [mv('s1', 100), mv('s3', 5)],
      fiyatlar: etkinFiyatlar([arpa, ivo], {}).fiyatlar,
      ayar: { partiler: {}, hayvanAlis: { '2': 9000 } },
      alisTahminleri: { '1': alisTahmini(25)!, '2': alisTahmini(25)! },
    })[0];

    const ids = new Set(FIYAT_REFERANS.map((x) => x.id));
    return [
      test(G, 'Gerçek fiyat tahmini ezer', gercekVar.tur === 'gercek' && gercekVar.fiyat === 12),
      test(G, 'Fiyat yoksa referanstan tahmini', tahmini.tur === 'tahmini' && tahmini.fiyat === refArpa.fiyat && tahmini.ref?.kaynakAd != null),
      test(G, 'Referansı olmayan → yok (uydurma yok)', yok.tur === 'yok' && yok.fiyat == null),
      test(G, 'kg → ton çevrimi', birimFiyatCoz(arpaTon, {}).fiyat === Math.round(refArpa.fiyat! * 1000 * 10000) / 10000),
      test(G, 'Uyumsuz birim (çuval) → yok', birimFiyatCoz(cuval, {}).tur === 'yok' && birimCevir(10, 'kg', 'çuval') == null),
      test(G, 'Etkin fiyatlar: gerçek + tahmini, yok hariç', fiyatlar.s4 === 20 && fiyatlar.s1 === refArpa.fiyat && !('s3' in fiyatlar)),
      test(G, 'Durum listesi', durumlar.map((d) => d.tur).join() === 'tahmini,yok,gercek'),
      test(G, 'Tahmini yem maliyete girer', r.yem === Math.round(100 * refArpa.fiyat!), `${r.yem}`),
      test(G, 'Alış: gerçek + tahmini karışık', r.alis === 9000 + 25 * CANLI_KUZU_KG.fiyat! && r.alisTahminiBas === 1 && r.alisEksikBas === 0),
      test(G, 'Tartım yoksa alış tahmini yok', alisTahmini(null) == null && alisTahmini(0) == null),
      test(G, 'Öneri metni Türkçe ondalık', oneriMetni(tahmini) === refArpa.fiyat!.toLocaleString('tr-TR', { maximumFractionDigits: 2 })),
      test(G, 'Fiyat metni okuma', fiyatMetniOku('1.250,5') === 1250.5 && fiyatMetniOku('12.5') === 12.5 && fiyatMetniOku('') == null && fiyatMetniOku('abc') == null),
      test(G, 'Her fiyatın kaynağı + tarihi var', FIYAT_REFERANS.every((x) => x.fiyat == null || (!!x.kaynakUrl && !!x.kaynakAd && !!x.veriTarihi))),
      test(G, 'Fiyat eksik listesi = null satırlar', FIYAT_EKSIK.length === FIYAT_REFERANS.filter((x) => x.fiyat == null).length && FIYAT_EKSIK.some((x) => x.id === 'ivermectin')),
      test(G, 'Tüm aşı katalog kalemleri tabloda', ASI_KATALOGU.every((k) => ids.has(k.id))),
      test(G, 'Devlet aşıları resmi fiyatlı', ['ppr', 'cicek', 'sap', 'brusella', 'sarbon'].every((id) => FIYAT_REFERANS.find((x) => x.id === id)?.fiyat != null)),
    ];
  },
};
