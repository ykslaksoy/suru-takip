import { test, type TestModul } from '../cerceve';
import { uyumDonemDurumu, uyumOtomatikRasyonDegisimi, type UyumBeslemeKayit } from '@/kaynak/yem/uyum-besleme';
import {
  bolmeCiftSecimVar,
  bolmeOzetHesapla,
  idempotentTasimaGerekli,
  secimGuncelMi,
  padokKapasiteYeterli,
  uyumBolmeDogrula,
  uyumBolmeKaydaUygula,
  type UyumBolmeGirdi,
} from '@/kaynak/yem/uyum-inceleme-bolme';

const k = (p: Partial<UyumBeslemeKayit>): UyumBeslemeKayit => ({
  id: 'u1',
  padok: 'Gözlem',
  baslangic: '2026-11-01',
  gunSayisi: 2,
  kayitZaman: '2026-10-31',
  ...p,
});

const padoklar = [
  { ad: 'Padok A', kapasite: 50, karantina: false, mevcutHayvan: 10 },
  { ad: 'Karantina', kapasite: 20, karantina: true, mevcutHayvan: 2 },
];

const karisik: UyumBolmeGirdi = {
  neden: 'Karışık bölme',
  padokHayvanIds: ['a1', 'a2', 'a3'],
  padokSonrakiInceleme: '2026-11-15',
  padoklar,
  kollar: [
    { karar: 'besiye_gecis', hayvanIds: ['a1'], hedefPadok: 'Padok A' },
    { karar: 'karantina_suphe', hayvanIds: ['a2'], hedefPadok: 'Karantina', supheNotu: 'halsizlik' },
    { karar: 'gozlem_uzat', hayvanIds: ['a3'], sonrakiInceleme: '2026-11-12' },
  ],
};

export const rasyonUyumBolmeModul: TestModul = {
  grup: 'Rasyon · gözlem bölme',
  calistir() {
    const kayit = k({});
    const bolunmus = uyumBolmeKaydaUygula(kayit, { id: 'o1', zaman: '2026-11-05T10:00:00.000Z', neden: 'x', kollar: [], degismeyenHayvanIds: [] }, karisik);
    const ozet = bolmeOzetHesapla(karisik);
    const sifirSecim = uyumBolmeDogrula({
      neden: 'yalnız uzat',
      kollar: [],
      padokHayvanIds: ['a1'],
      padokSonrakiInceleme: '2026-11-20',
      padoklar,
    });
    const sifirSecimHata = uyumBolmeDogrula({
      neden: 'boş',
      kollar: [],
      padokHayvanIds: ['a1'],
      padoklar,
    });
    const cift = bolmeCiftSecimVar([
      { karar: 'besiye_gecis', hayvanIds: ['a1', 'a2'] },
      { karar: 'gozlem_uzat', hayvanIds: ['a2'] },
    ]);
    const kapasiteHata = padokKapasiteYeterli({ ad: 'Karantina', kapasite: 3, karantina: true, mevcutHayvan: 2 }, 2);
    const kismiKalan = uyumBolmeDogrula({
      neden: 'kısmi',
      kollar: [{ karar: 'besiye_gecis', hayvanIds: ['a1'], hedefPadok: 'Padok A' }],
      padokHayvanIds: ['a1', 'a2'],
      padoklar,
    });

    return [
      test('Bolme', 'Karışık durum', uyumDonemDurumu(bolunmus, '2026-11-12') === 'karisik_bolme'),
      test('Bolme', 'Plan otomatik değişmez', uyumOtomatikRasyonDegisimi(bolunmus, '2026-11-10') === false),
      test('Bolme', 'Hayvan takip bağlantısı', bolunmus.hayvanUyumTakibi?.a1?.uyumKayitId === 'u1'),
      test('Bolme', 'Besiye takip kararı', bolunmus.hayvanUyumTakibi?.a1?.sonKarar === 'besiye_gecis'),
      test('Bolme', 'Özet üç kola', ozet.length === 3),
      test('Bolme', 'Sıfır atama padok tarihi', sifirSecim === null),
      test('Bolme', 'Sıfır seçim hata', sifirSecimHata !== null),
      test('Bolme', 'Çift seçim yasak', cift !== null),
      test('Bolme', 'Kapasite yetersiz', kapasiteHata !== null),
      test('Bolme', 'Kalan için tarih zorunlu', kismiKalan !== null),
      test('Bolme', 'Seçim güncel', secimGuncelMi(['a1'], ['a1', 'a2']) === true),
      test('Bolme', 'Eski seçim geçersiz', secimGuncelMi(['x'], ['a1']) === false),
      test(
        'Bolme',
        'İdempotans atla',
        idempotentTasimaGerekli('a1', 'Padok A', 'o1', { a1: { oturumId: 'o1', hedefPadok: 'Padok A' } }, 'Padok A') === false,
      ),
      test(
        'Bolme',
        'Denetim kolları',
        (bolunmus.incelemeKararlari?.filter((x) => x.oturumId === 'o1').length ?? 0) === 3,
      ),
      (() => {
        const g: UyumBolmeGirdi = {
          neden: 'kısmi',
          padokHayvanIds: ['a1', 'a2'],
          padokSonrakiInceleme: '2026-11-20',
          padoklar,
          kollar: [{ karar: 'besiye_gecis', hayvanIds: ['a1'], hedefPadok: 'Padok A' }],
        };
        const o = { id: 'o2', zaman: '2026-11-06T10:00:00.000Z', neden: 'k', kollar: [], degismeyenHayvanIds: [] };
        const y = uyumBolmeKaydaUygula(kayit, o, g);
        return test(
          'Bolme',
          'Değişmeyen kayıt',
          y.hayvanUyumTakibi?.a2?.sonKarar === 'gozlem_uzat' && y.hayvanUyumTakibi?.a1?.sonKarar === 'besiye_gecis',
        );
      })(),
    ];
  },
};
