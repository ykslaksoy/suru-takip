import { test, type TestModul } from '../cerceve';
import {
  ertesiGun,
  gunFarki,
  hayvanPolicesi,
  hayvanPrimPaylari,
  policeDogrula,
  policeDurumu,
  sayiCoz,
  sigortasizHayvanlar,
  sigortaUyarilari,
  tarihCoz,
  tarihGoster,
  yillikBitis,
  type SigortaPolice,
} from '@/kaynak/sigorta/hesap';
import { partiMaliyetleri } from '@/kaynak/maliyet/hesap';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const G = 'Sigorta (TARSİM)';
const pol = (id: string, baslangic: string, bitis: string, hayvanIds: string[], prim?: number): SigortaPolice => ({
  id, policeNo: `P-${id}`, baslangic, bitis, hayvanIds, prim, createdAt: '',
});
const an = (id: string, paddock: string, status: Animal['status'] = 'healthy'): Animal => ({
  id, earTag: `TR-${id}`, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock, status,
  motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '', createdAt: '', updatedAt: '', syncStatus: 'synced',
});

export const sigortaModul: TestModul = {
  grup: G,
  calistir() {
    const bugun = '2026-10-19';
    const uzak = pol('a', '2026-01-01', '2026-12-31', ['1', '2']);
    const ay = pol('b', '2025-11-18', '2026-11-17', ['3']); // 29 gün
    const hafta = pol('c', '2025-10-25', '2026-10-24', ['4']); // 5 gün
    const doldu = pol('d', '2025-10-10', '2026-10-09', ['5']); // 10 gün önce
    const hayvanlar = ['1', '2', '3', '4', '5', '6'].map((i) => ({ id: i, status: 'healthy' }));
    hayvanlar.push({ id: '7', status: 'sold' });
    const tum = [uzak, ay, hafta, doldu];
    const u = sigortaUyarilari(tum, hayvanlar, bugun);
    const yenilenmis = [...tum, pol('e', '2026-10-10', '2027-10-09', ['5'])];
    const animals = [an('1', 'Padok A'), an('2', 'Padok A'), an('3', 'Padok B')];
    const m = partiMaliyetleri({
      animals,
      sonKg: {},
      items: [],
      movements: [],
      fiyatlar: {},
      ayar: { partiler: {}, hayvanAlis: { '1': 0, '2': 0, '3': 0 } },
      sigortaPrimleri: hayvanPrimPaylari([pol('x', bugun, bugun, ['1', '2', '3'], 900)]),
    });
    return [
      test(G, 'tarih GG.AA.YYYY çözülür', tarihCoz('5.3.2027') === '2027-03-05' && tarihCoz('2026-10-19') === '2026-10-19'),
      test(G, 'geçersiz tarih reddedilir', tarihCoz('31.02.2026') === null && tarihCoz('abc') === null),
      test(G, 'tarih gösterimi', tarihGoster('2026-10-19') === '19.10.2026'),
      test(G, 'yıllık bitiş = 1 yıl − 1 gün', yillikBitis('2026-10-19') === '2027-10-18' && yillikBitis('2026-01-01', 6) === '2026-06-30'),
      test(G, 'ertesi gün (ay sonu)', ertesiGun('2026-10-31') === '2026-11-01'),
      test(G, 'gün farkı', gunFarki('2026-10-19', '2026-10-24') === 5),
      test(G, 'durumlar: aktif / 30 gün / 7 gün / doldu / başlamadı',
        policeDurumu(uzak, bugun) === 'aktif' &&
          policeDurumu(ay, bugun) === 'yaklasiyor' &&
          policeDurumu(hafta, bugun) === 'son-hafta' &&
          policeDurumu(doldu, bugun) === 'doldu' &&
          policeDurumu(pol('f', '2026-11-01', '2027-10-31', []), bugun) === 'baslamadi'),
      test(G, 'bitiş günü hâlâ geçerli', policeDurumu(pol('g', '2026-01-01', bugun, []), bugun) === 'son-hafta'),
      test(G, 'hayvan poliçesi bulunur', hayvanPolicesi(tum, '1', bugun)?.id === 'a' && hayvanPolicesi(tum, '5', bugun) === null),
      test(G, 'sigortasızlar: süresi dolan + hiç olmayan, satılan hariç',
        sigortasizHayvanlar(hayvanlar, tum, bugun).map((h) => h.id).join(',') === '5,6'),
      test(G, '30 gün uyarısı "sıra"', u.some((x) => x.id === 'sigorta-bitis-b' && x.seviye === 'sira' && x.baslik.includes('29 gün'))),
      test(G, '7 gün uyarısı "acil"', u.some((x) => x.id === 'sigorta-bitis-c' && x.seviye === 'uyari')),
      test(G, 'süresi doldu uyarısı', u.some((x) => x.id === 'sigorta-doldu-d' && x.aciklama.includes('1 kuzu korumasız'))),
      test(G, 'uzak bitiş uyarı vermez', !u.some((x) => x.policeId === 'a')),
      test(G, 'sigortasız özet satırı', u.some((x) => x.id === 'sigorta-sigortasiz' && x.aciklama.startsWith('2 kuzu'))),
      test(G, 'yenilenen poliçe "doldu" uyarısı vermez', !sigortaUyarilari(yenilenmis, hayvanlar, bugun).some((x) => x.id === 'sigorta-doldu-d')),
      test(G, 'poliçe yoksa uyarı yok', sigortaUyarilari([], hayvanlar, bugun).length === 0),
      test(G, 'prim kuzulara eşit bölünür', hayvanPrimPaylari([pol('x', bugun, bugun, ['1', '2', '3'], 900)])['2'] === 300),
      test(G, 'prim Maliyet’e partiye göre girer',
        m.find((x) => x.parti === 'Padok A')?.sigorta === 600 && m.find((x) => x.parti === 'Padok B')?.sigorta === 300),
      test(G, 'sayı çözümü', sayiCoz('4.500') === 4500 && sayiCoz('1.250,50') === 1250.5 && sayiCoz('') === null),
      test(G, 'doğrulama: poliçe no zorunlu', policeDogrula({ policeNo: ' ', baslangic: '19.10.2026', bitis: '18.10.2027', hayvanIds: ['1'] }) !== null),
      test(G, 'doğrulama: bitiş başlangıçtan önce olamaz', policeDogrula({ policeNo: '1', baslangic: '19.10.2026', bitis: '18.10.2026', hayvanIds: ['1'] }) !== null),
      test(G, 'doğrulama: kuzu seçilmeli', policeDogrula({ policeNo: '1', baslangic: '19.10.2026', bitis: '18.10.2027', hayvanIds: [] }) !== null),
      test(G, 'doğrulama: geçerli form', policeDogrula({ policeNo: '1', sirket: '', prim: '', baslangic: '19.10.2026', bitis: '18.10.2027', hayvanIds: ['1'] }) === null),
    ];
  },
};
