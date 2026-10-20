import { test, type TestModul } from '../cerceve';
import {
  ajanda,
  arinmaOlaylari,
  ayIzgarasi,
  ayKaydir,
  gorevOlaylari,
  gunOlaylari,
  gunSayilari,
  olaylariBirlestir,
  saglikOlaylari,
  sigortaOlaylari,
  tartimOlaylari,
} from '@/kaynak/takvim/hesap';

const G = 'Takvim';
const et = (id: string) => `K-${id}`;

export const takvimModul: TestModul = {
  grup: G,
  calistir() {
    const saglik = saglikOlaylari(
      [
        { id: '1', animalId: 'a', recordType: 'vaccine', medicine: 'Karma aşı', treatment: '', recordedAt: '2026-10-10T12:00:00Z' },
        { id: '2', animalId: 'b', recordType: 'vaccine', medicine: 'Karma aşı', treatment: '', recordedAt: '2026-10-10' },
        { id: '3', animalId: 'c', recordType: 'treatment', medicine: 'İvermektin', treatment: '', recordedAt: '2026-10-11' },
        { id: '4', animalId: 'c', recordType: 'illness', medicine: '', treatment: '', recordedAt: '2026-10-11' },
      ],
      et,
    );
    const tartim = tartimOlaylari(
      [
        { id: 'w1', animalId: 'a', weightKg: 20, recordedAt: '2026-10-12' },
        { id: 'w2', animalId: 'b', weightKg: 30, recordedAt: '2026-10-12T08:00:00Z' },
        { id: 'w3', animalId: 'c', weightKg: 25, recordedAt: '2026-10-13' },
      ],
      et,
    );
    const ar = arinmaOlaylari([{ animalId: 'a', bitis: '2026-11-21', ilac: 'İvermektin' }], et);
    const sig = sigortaOlaylari([{ id: 'p', policeNo: 'P1', bitis: '2026-12-31', hayvanIds: ['a', 'b'] }]);
    const gor = gorevOlaylari([
      { id: 'g1', baslik: 'Aşı', aciklama: '', href: '/gorevler', tarih: '2026-10-25', kaynak: 'asi' },
      { id: 'g2', baslik: 'Arınma', aciklama: '', href: '/', tarih: '2026-10-19', kaynak: 'bekletme' },
      { id: 'g3', baslik: 'Tarihsiz', aciklama: '', href: '/', kaynak: 'asi' },
      { id: 'g4', baslik: 'Stok azaldı', aciklama: '', href: '/', tarih: '2026-10-19', kaynak: 'stok' },
    ]);
    const hepsi = olaylariBirlestir(saglik, tartim, ar, sig, gor, ar);
    const ekim = ayIzgarasi(2026, 9);
    return [
      test(G, 'toplu aşı aynı gün tek olay', saglik.filter((o) => o.tur === 'asi').length === 1 && saglik.find((o) => o.tur === 'asi')?.adet === 2),
      test(G, 'çok kuzulu olay Sağlık ekranına gider', saglik.find((o) => o.tur === 'asi')?.href === '/(tabs)/saglik'),
      test(G, 'tek kuzulu olay kuzu kartına gider', saglik.find((o) => o.tur === 'tedavi')?.href === '/hayvan/c'),
      test(G, 'hastalık kaydı takvime girmez', saglik.length === 2),
      test(G, 'tartım günlük gruplanır + ortalama', tartim.find((o) => o.tarih === '2026-10-12')?.aciklama === 'ort. 25 kg'),
      test(G, 'tek tartım kilo başlıkta', tartim.find((o) => o.tarih === '2026-10-13')?.baslik === 'Tartım · 25 kg'),
      test(G, 'arınma bitişi olayı', ar[0].tarih === '2026-11-21' && ar[0].href === '/hayvan/a'),
      test(G, 'sigorta bitişi olayı', sig[0].tarih === '2026-12-31' && sig[0].href === '/sigorta'),
      test(G, 'görevlerden arınma/stok/tarihsiz ayıklanır', gor.length === 1 && gor[0].tarih === '2026-10-25' && gor[0].tur === 'asi' && gor[0].baslik.startsWith('Yapılacak')),
      test(G, 'birleştirme tekrarı atar ve sıralar', hepsi.length === saglik.length + tartim.length + 3 && hepsi[0].tarih === '2026-10-10'),
      test(G, 'gün olayları', gunOlaylari(hepsi, '2026-10-12').length === 1),
      test(G, 'gün sayıları', gunSayilari(hepsi)['2026-10-10'] === 1),
      test(G, 'Ekim 2026 Perşembe başlar (Pzt ilk)', ekim[0][3] === '2026-10-01' && ekim[0][2] === null),
      test(G, 'ay ızgarası 31 gün', ekim.flat().filter(Boolean).length === 31 && ekim.every((h) => h.length === 7)),
      test(G, 'ay kaydırma yıl geçişi', ayKaydir(2026, 11, 1).yil === 2027 && ayKaydir(2026, 0, -1).ay === 11),
      test(G, 'ajanda aralığı', ajanda(hepsi, '2026-10-19', 14, 60).every((g) => g.tarih >= '2026-10-05' && g.tarih <= '2026-12-18')),
      test(G, 'ajanda gün gruplu sıralı', (() => { const a = ajanda(hepsi, '2026-10-19', 30, 90); return a.length > 0 && a.every((g, i) => i === 0 || a[i - 1].tarih < g.tarih); })()),
    ];
  },
};
