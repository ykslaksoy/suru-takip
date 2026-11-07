import { hayvanKesinEslestir } from '@/kaynak/kilo/hizli-tartim-akisi';
import {
  aramaJetonuUret,
  gecikmisAramaMi,
  kuzuAramaTerimiHamdan,
  metinSadeceKiloGibiMi,
  onayHalaGecerli,
} from '@/kaynak/kilo/kuzu-tanima-akisi';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { test, type TestModul } from '../cerceve';

const a = (sirt: string): Animal =>
  ({
    id: 'x',
    earTag: 'TR-1',
    sirtNo: sirt,
    turkvetNo: '',
    name: '',
    breed: '',
    species: 'sheep',
    sex: 'male',
    birthDate: '2025-01-01',
    paddock: 'A',
    status: 'healthy',
    motherId: null,
    gehisId: null,
  }) as Animal;

export const kuzuTanimaAkisiModul: TestModul = {
  grup: 'Kuzu tanıma akışı',
  calistir() {
    const g = 'Kuzu tanıma akışı';
    return [
      test(g, 'Ses kilo küpe değil', metinSadeceKiloGibiMi('68 kilo')),
      test(g, 'Küpe araması', kuzuAramaTerimiHamdan('küpe TR-34-001') === 'TR-34-001'),
      test(g, 'Gecikmiş arama', gecikmisAramaMi(1, 2)),
      test(g, 'Jeton artar', aramaJetonuUret(3) === 4),
      test(g, 'Sırt baştaki sıfır', hayvanKesinEslestir('087', [a('087')]).durum === 'bulundu'),
      test(
        g,
        'Aynı küpe belirsiz',
        hayvanKesinEslestir('TR-34', [
          { ...a('1'), id: '1', earTag: 'TR-34-001' },
          { ...a('2'), id: '2', earTag: 'TR-34-002' },
        ] as Animal[]).durum === 'belirsiz',
      ),
      test(
        g,
        'Onay nesil tutarlı',
        onayHalaGecerli('id1', 'id1', 2, 2),
      ),
      test(
        g,
        'Onay nesil uyumsuz',
        !onayHalaGecerli('id1', 'id1', 2, 1),
      ),
    ];
  },
};
