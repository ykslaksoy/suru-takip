import { test, type TestModul } from '../cerceve';
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import {
  asiDozEtiketiStok,
  asiMetaOku,
  asiMetaYaz,
  asiPartiSec,
  asiStokDusumPlanla,
  asiUrunDogrula,
  bosAsiStokMeta,
  legacyAsiStokMu,
  markaliAsiUrunuMu,
  stokGorunenAd,
} from '@/kaynak/stok/asi-urun-meta';

const g = 'Stok aşı ürün meta';

const v = (notes: string, qty = 10): StockItem => ({
  id: '1',
  name: 'Karma aşı',
  type: 'vaccine',
  quantity: qty,
  unit: 'doz',
  minQuantity: 5,
  expiryDate: '2026-06-01',
  notes,
});

export const stokAsiUrunModul: TestModul = {
  grup: g,
  calistir() {
    const meta = {
      ...bosAsiStokMeta('karma'),
      marka: 'Örnek marka',
      urunAdi: 'Karma S',
      partiLot: 'L2024',
      siseHacim: 100,
      siseHacimBirim: 'ml',
      etiketDoz: '2 ml SC kuzu',
      etiketDozKaynak: 'etiket_manuel' as const,
      etiketKapsam: 'Clostridial + Pastorella',
      etiketKapsamKaynak: 'etiket_manuel' as const,
    };
    const notes = asiMetaYaz('depo rafı', meta);
    const item = v(notes);
    const lotB = {
      ...v(asiMetaYaz('', { ...meta, partiLot: 'L2025' }), 5),
      id: '2',
      expiryDate: '2025-12-01',
    };
    const lotA = { ...item, expiryDate: '2026-01-01' };

    const dus = asiStokDusumPlanla(10, 5, [], 'iz1');
    const cift = asiStokDusumPlanla(10, 5, ['plan iz1'], 'iz1');

    return [
      test(g, 'Meta yaz/oku', asiMetaOku(item)?.partiLot === 'L2024'),
      test(g, 'Kullanıcı notu ayrı', notes.startsWith('depo rafı')),
      test(g, 'Markalı ürün', markaliAsiUrunuMu(item)),
      test(g, 'Görünen ad lotlu', stokGorunenAd(item).includes('L2024')),
      test(g, 'Legacy meta yok', legacyAsiStokMu(v('eski not'))),
      test(g, 'Etiket dozu kullanılır', !asiDozEtiketiStok(2, item).bilinmiyor),
      test(
        g,
        'Doz bilinmiyor uyarı',
        asiDozEtiketiStok(2, v(asiMetaYaz('', { ...bosAsiStokMeta('karma'), etiketDozKaynak: 'bilinmiyor' }))).bilinmiyor,
      ),
      test(g, 'Doğrulama eksik marka', asiUrunDogrula(bosAsiStokMeta('karma'), 'doz').uyari.length > 0),
      test(g, 'Parti SKT yakın seçilir', asiPartiSec([lotA, lotB])?.id === '2'),
      test(g, 'Düşüm plan', dus.dusulecek === 5 && !dus.ciftSayim),
      test(g, 'Çift düşüm engeli', cift.ciftSayim && cift.dusulecek === 0),
    ];
  },
};
