import { test, type TestModul } from '../cerceve';
import { kupeListesiAyikla, partiAdiCoz, topluSec, grupEtiketi } from '@/kaynak/toplu/secim';
import { programEslestir } from '@/kaynak/toplu/program-esle';
import { grupKomutAyikla } from '@/kaynak/ses/grup';
import { komutAyikla } from '@/kaynak/ses/komut';
import { geriOkumaMetni, onayCumlesi } from '@/kaynak/ses/geri-okuma';
import type { Animal } from '@/kaynak/cekirdek/tipler';

function hayvan(id: string, earTag: string, paddock: string, status: Animal['status'] = 'healthy'): Animal {
  return {
    id, earTag, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock, status,
    motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '', createdAt: '', updatedAt: '', syncStatus: 'synced',
  };
}

const H = [
  hayvan('1', 'TR001201', 'Padok A'),
  hayvan('2', 'TR001202', 'Padok C'),
  hayvan('3', 'TR001203', 'Padok C'),
  hayvan('4', 'TR001204', 'Padok C', 'sold'),
];

export const topluModul: TestModul = {
  grup: 'Toplu seçim + sesli parti',
  calistir: () => {
    const g = 'Toplu';
    const r = [
      test(g, '3 → Padok C', partiAdiCoz('3') === 'Padok C'),
      test(g, 'b → Padok B', partiAdiCoz('b') === 'Padok B'),
      test(g, 'küpe listesi ayıkla', kupeListesiAyikla('1201, 1202\n1202;abc 1203').join() === '1201,1202,1203'),
      test(g, 'tümü yalnız aktif', topluSec(H, { tur: 'tum' }).secilen.length === 3),
      test(g, 'padok C 2 aktif', topluSec(H, { tur: 'padok', ad: 'Padok C' }).secilen.length === 2),
      test(g, 'liste son rakamla eşler, yoksa bildirir', (() => {
        const s = topluSec(H, { tur: 'liste', kupeler: ['1201', '9999'] });
        return s.secilen.length === 1 && s.bulunamayan[0] === '9999';
      })()),
      test(g, 'grup etiketi parti', grupEtiketi({ tur: 'padok', ad: 'Padok C' }) === '3. parti (Padok C)'),
      test(g, 'çiçek eşleşir', programEslestir('çiçek aşısı')?.id === 'cicek'),
      test(g, 'selenyum eşleşir', programEslestir('selenyum')?.id === 'selen-e'),
      test(g, 'ivermektin eşleşir', programEslestir('ivermektin')?.id === 'ivermektin'),
    ];
    const k1 = grupKomutAyikla('3. parti karma aşısı yapıldı');
    r.push(test(g, '"3. parti karma" ayıklanır', k1?.programId === 'karma' && k1.grup.tur === 'padok' && k1.grup.ad === 'Padok C', JSON.stringify(k1)));
    const k2 = komutAyikla('tüm kuzular ivermektin');
    r.push(test(g, '"tüm kuzular ivermektin" grup', k2?.tur === 'grup_asi' && k2.grup.tur === 'tum' && k2.programId === 'ivermektin', JSON.stringify(k2)));
    const k3 = komutAyikla('küpe 1234 aşı çiçek');
    r.push(test(g, 'tek küpe komutu bozulmaz', k3?.tur === 'asi'));
    const k4 = komutAyikla('küpe 1234, 68 kilo');
    r.push(test(g, 'tartım bozulmaz', k4?.tur === 'tartim'));
    if (k1) {
      const z = { ...k1, hayvanSayisi: 42 };
      r.push(test(g, 'geri okuma sayı içerir', geriOkumaMetni(z).includes('42 kuzu') && geriOkumaMetni(z).includes('3. parti')));
      r.push(test(g, 'sesli cümle onay sorar', onayCumlesi(z).startsWith('3. parti') && onayCumlesi(z).includes('Onaylıyor musunuz?'), onayCumlesi(z)));
    }
    return r;
  },
};
