import { test, type TestModul } from '../cerceve';
import { denetimFiltrele, farklar, HAYVAN_ALANLARI, type DenetimKaydi } from '@/kaynak/cekirdek/denetim-hesap';
import { copKalanGun, copSuresiDolanlar, hayvanCopVerisi, COP_SAKLAMA_GUN } from '@/kaynak/gecmis/cop';

const G = 'Geri dönüşüm + işlem kaydı';
const GUN = 86400000;

export const geriDonusumModul: TestModul = {
  grup: G,
  calistir() {
    const simdi = Date.parse('2026-10-19T12:00:00Z');
    const once = (g: number) => new Date(simdi - g * GUN).toISOString();
    const l = [{ id: 'a', silinme: once(1) }, { id: 'b', silinme: once(29.5) }, { id: 'c', silinme: once(31) }];
    const { kalan, dolan } = copSuresiDolanlar(l, simdi);
    const d = farklar(
      { paddock: 'Padok A', status: 'healthy', notes: 'x', earTag: 'TR1' },
      { paddock: 'Padok B', status: 'healthy', notes: 'x', earTag: 'TR1' },
      HAYVAN_ALANLARI,
    );
    const kayitlar = [
      { id: '1', tablo: 'hayvan', animalId: 'a', kimId: 'u1' },
      { id: '2', tablo: 'saglik', animalId: 'a', kimId: 'u2' },
      { id: '3', tablo: 'hayvan', animalId: 'b', kimId: 'u1' },
    ] as DenetimKaydi[];
    const eski = hayvanCopVerisi({ id: 'x', earTag: 'TR' });
    const yeni = hayvanCopVerisi({ animal: { id: 'y' }, weights: [{ id: 'w' }], health: [] });
    return [
      test(G, 'saklama süresi 30 gün', COP_SAKLAMA_GUN === 30),
      test(G, '30 günü dolan ayıklanır', kalan.map((x) => x.id).join(',') === 'a,b' && dolan.map((x) => x.id).join(',') === 'c'),
      test(G, 'kalan gün', copKalanGun({ silinme: once(1) }, simdi) === 29 && copKalanGun({ silinme: once(40) }, simdi) === 0),
      test(G, 'değişen alan eski → yeni', d.length === 1 && d[0].alan === 'Parti / padok' && d[0].eski === 'Padok A' && d[0].yeni === 'Padok B'),
      test(G, 'yeni kayıtta fark listesi boş', farklar(null, { paddock: 'A' }, HAYVAN_ALANLARI).length === 0),
      test(G, 'boş değer — olarak gösterilir', farklar({ notes: '' }, { notes: 'Alım' }, { notes: 'Not' })[0]?.eski === '—'),
      test(G, 'uzun değer kısaltılır', farklar({ notes: 'a' }, { notes: 'b'.repeat(100) }, { notes: 'Not' })[0].yeni.length <= 60),
      test(G, 'filtre: tablo', denetimFiltrele(kayitlar, { tablo: 'hayvan' }).length === 2),
      test(G, 'filtre: kuzu + kişi', denetimFiltrele(kayitlar, { animalId: 'a', kimId: 'u1' }).map((x) => x.id).join() === '1'),
      test(G, 'eski çöp biçimi (yalnız kuzu) okunur', eski.animal.id === 'x' && eski.weights.length === 0),
      test(G, 'yeni çöp biçimi kayıtlarla', yeni.animal.id === 'y' && yeni.weights.length === 1),
    ];
  },
};
