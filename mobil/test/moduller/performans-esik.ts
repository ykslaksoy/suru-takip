import {
  cozumlePerformansEsikleri,
  aktifEsikOzet,
} from '@/kaynak/kilo/performans-esik-oncelik';
import {
  fcrEsikDogrula,
  gcaaEsikDogrula,
  kapsamAnahtar,
  type PerformansEsikDepo,
} from '@/kaynak/kilo/performans-esik-tipler';
import {
  performansEsikFcrDegerlendir,
  performansEsikGcaaDegerlendir,
  performansEsikUyumBaskiNedeni,
} from '@/kaynak/kilo/performans-esik-degerlendir';
import { suruOrtGcaaEsikDegerlendir } from '@/kaynak/kilo/performans-esik-suruk';
import { adgHesapla } from '@/kaynak/kilo/adg';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { test, type TestModul } from '../cerceve';

const depoOrnek = (): PerformansEsikDepo => ({
  surum: 1,
  kayitlar: [
    {
      id: '1',
      kapsam: { tur: 'genel' },
      gcaaAlt: { etkin: true, deger: 150 },
      fcrUst: { etkin: true, deger: 7 },
      guncelleme: '2025-01-01',
    },
    {
      id: '2',
      kapsam: { tur: 'padok', padokAd: 'Padok A' },
      gcaaAlt: { etkin: true, deger: 200 },
      fcrUst: null,
      guncelleme: '2025-01-01',
    },
    {
      id: '3',
      kapsam: { tur: 'padok_faz', padokAd: 'Padok A', faz: 'lamb_fattening' },
      gcaaAlt: { etkin: true, deger: 220 },
      fcrUst: { etkin: false, deger: 5 },
      guncelleme: '2025-01-01',
    },
  ],
});

const w = (kg: number, at: string): WeightRecord[] => [
  { id: '1', animalId: 'a', weightKg: 40, recordedAt: '2025-01-01', notes: '' },
  { id: '2', animalId: 'a', weightKg: 46, recordedAt: '2025-01-31', notes: '' },
];

export const performansEsikModul: TestModul = {
  grup: 'Performans eşikleri',
  calistir() {
    const g = 'Performans eşikleri';
    const depo = depoOrnek();
    const padokA = cozumlePerformansEsikleri(depo, 'Padok A', 'lamb_fattening');
    const genel = cozumlePerformansEsikleri(depo, 'Padok B', 'lamb_fattening');
    const tekTartim = adgHesapla([w(40, 'x')[0]!]);
    const olcum = adgHesapla(w(40, 'x'));

    const gcaaAlt = performansEsikGcaaDegerlendir(olcum, {
      gcaaAltGram: 250,
      gcaaKaynak: 'test',
      fcrUst: 7,
      fcrKaynak: 'test',
    });
    const gcaaYetersiz = performansEsikGcaaDegerlendir(tekTartim, {
      gcaaAltGram: 200,
      gcaaKaynak: 'test',
      fcrUst: null,
      fcrKaynak: null,
    });

    const suruYok = suruOrtGcaaEsikDegerlendir({ surum: 1, kayitlar: [] }, 120, 'Padok A');
    const suruAlt = suruOrtGcaaEsikDegerlendir(depo, 100, 'Padok A');
    const suruVeriYok = suruOrtGcaaEsikDegerlendir(depo, null, 'Padok A');

    const json = JSON.stringify(depo);
    const yuklenen = JSON.parse(json) as PerformansEsikDepo;
    const yeniden = cozumlePerformansEsikleri(yuklenen, 'Padok A', 'lamb_fattening');

    return [
      test(g, 'Öncelik padok+faz GCAA', padokA.gcaaAltGram === 220 && padokA.gcaaKaynak?.includes('Padok A')),
      test(g, 'Öncelik padok FCR genel', padokA.fcrUst === 7),
      test(g, 'Genel eşik', genel.gcaaAltGram === 150),
      test(g, 'Eşik yok boş depo', aktifEsikOzet(cozumlePerformansEsikleri({ surum: 1, kayitlar: [] }, '', 'maintenance')).includes('tanımlı değil')),
      test(g, 'GCAA birim reddi', gcaaEsikDogrula(0.2).ok === false),
      test(g, 'FCR birim reddi', fcrEsikDogrula(200).ok === false),
      test(g, 'Geçerli GCAA', gcaaEsikDogrula(180).ok === true),
      test(g, 'Yetersiz veri alarm yok', gcaaYetersiz.sonuc === 'yetersiz_veri'),
      test(g, 'Hedef altı', gcaaAlt.sonuc === 'hedef_alti'),
      test(g, 'Sürü eşik yok', suruYok.durum === 'esik_yok'),
      test(g, 'Sürü hedef altı', suruAlt.durum === 'hedef_alti'),
      test(g, 'Sürü veri yok', suruVeriYok.durum === 'yetersiz_veri'),
      test(g, 'Gözlem baskı', performansEsikUyumBaskiNedeni({ gozlemPadok: true, karantinaPadok: false }) != null),
      test(g, 'Kapsam anahtar', kapsamAnahtar({ tur: 'padok_faz', padokAd: 'Padok A', faz: 'lamb_fattening' }).includes('padok_faz')),
      test(g, 'Persist yeniden çözüm', yeniden.gcaaAltGram === padokA.gcaaAltGram),
      test(
        g,
        'FCR yetersiz veri',
        performansEsikFcrDegerlendir(
          { durum: 'yok', neden: 'x' },
          { gcaaAltGram: null, gcaaKaynak: null, fcrUst: 6, fcrKaynak: 'g' },
        ).sonuc === 'yetersiz_veri',
      ),
    ];
  },
};
