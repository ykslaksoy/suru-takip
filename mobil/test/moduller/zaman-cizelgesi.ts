import { test, type TestModul } from '../cerceve';
import { hayvanZamanCizelgesi } from '@/kaynak/gecmis/zaman-cizelgesi';
import type { Animal, HealthRecord, WeightRecord } from '@/kaynak/cekirdek/tipler';

const A: Animal = { id: 'k1', earTag: 'TR1', turkvetNo: '', name: '', breed: 'Merinos', species: 'sheep', sex: 'male', birthDate: '', paddock: 'Padok A', status: 'sold',
  motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-10-18T08:00:00Z', syncStatus: 'synced' };
const W: WeightRecord[] = [
  { id: 'w2', animalId: 'k1', weightKg: 30, recordedAt: '2026-10-01T08:00:00Z', notes: '' },
  { id: 'w1', animalId: 'k1', weightKg: 22, recordedAt: '2026-09-01T09:00:00Z', notes: 'Alım tartımı' },
];
const H: HealthRecord[] = [{ id: 'h1', animalId: 'k1', recordType: 'vaccine', symptoms: '', diagnosis: '', treatment: '2 ml', medicine: 'Karma aşı', withdrawalDays: 0, vetName: '', recordedAt: '2026-09-02', notes: '' }];

export const zamanCizelgesiModul: TestModul = {
  grup: 'Hayvan kartı zaman çizelgesi',
  calistir: () => {
    const g = 'Zaman çizelgesi';
    const z = hayvanZamanCizelgesi({
      animal: A, weights: W, health: H,
      islemler: [
        { id: 'l1', zaman: '2026-09-15T08:00:00Z', kim: 'Bu cihaz', tur: 'padok', ozet: 'Parti: Gözlem → Padok A', animalId: 'k1' },
        { id: 'l2', zaman: '2026-09-16T08:00:00Z', kim: 'Bu cihaz', tur: 'padok', ozet: 'başka', animalId: 'k2' },
      ],
    });
    return [
      test(g, 'en yeni üstte (satış)', z[0].tur === 'satis'),
      test(g, 'en eski giriş', z[z.length - 1].tur === 'giris'),
      test(g, 'tartım farkı', z.some((o) => o.tur === 'tartim' && o.detay.startsWith('+8 kg'))),
      test(g, 'aşı olayı', z.some((o) => o.tur === 'asi' && o.baslik === 'Karma aşı')),
      test(g, 'yalnız bu kuzunun padok işlemi', z.filter((o) => o.tur === 'padok').length === 1),
      test(g, 'toplam olay', z.length === 6, String(z.length)),
    ];
  },
};
