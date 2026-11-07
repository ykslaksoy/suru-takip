import { test, type TestModul } from '../cerceve';
import {
  fcrDegerMetni,
  fcrYemBazAciklamasi,
  gcaaDegerMetni,
  metrikBaslik,
  metrikTooltip,
  metrikYetersizVeri,
  PERFORMANS_METRIK,
} from '@/kaynak/kilo/performans-metrik-etiket';

export const performansMetrikEtiketModul: TestModul = {
  grup: 'Performans metrik etiketleri',
  calistir() {
    const g = 'Metrik etiket';
    return [
      test(g, 'FCR başlık Türkçe', metrikBaslik('FCR').includes('Yemden yararlanma oranı (FCR)')),
      test(g, 'GCAA başlık', metrikBaslik('GCAA').includes('Günlük canlı ağırlık artışı (GCAA)')),
      test(g, 'FCR birim', PERFORMANS_METRIK.FCR.birim.includes('kg yem/kg')),
      test(g, 'GCAA birim', PERFORMANS_METRIK.GCAA.birim === 'g/gün'),
      test(g, 'FCR açıklama düşük iyidir', metrikTooltip('FCR').includes('düşük')),
      test(g, 'Yüzde değil', !metrikTooltip('FCR').toLowerCase().includes('verim %')),
      test(g, 'As-fed uyarısı', fcrYemBazAciklamasi('stok_cikis').includes('as-fed')),
      test(g, 'KM karıştırma yok', fcrYemBazAciklamasi(null).includes('karıştırılmaz')),
      test(g, 'FCR değer formatı', fcrDegerMetni(4.2).includes('kg yem/kg')),
      test(g, 'GCAA değer g/gün', gcaaDegerMetni(200).includes('g/gün')),
      test(g, 'Yetersiz FCR', metrikYetersizVeri('FCR').length > 10),
      test(g, 'Yetersiz GCAA', metrikYetersizVeri('GCAA').includes('tartım')),
    ];
  },
};
