import { test, type TestModul } from '../cerceve';
import { planVadeleri, varsayilanZaman, zamanEtiketi, vadeOzeti } from '@/kaynak/gorevler/plan-takvim';
import type { Animal, HealthRecord } from '@/kaynak/cekirdek/tipler';

const NOW = Date.UTC(2026, 9, 19, 9);
function hayvan(id: string, createdAt: string, status: Animal['status'] = 'healthy'): Animal {
  return { id, earTag: id, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock: 'Padok A', status,
    motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '', createdAt, updatedAt: '', syncStatus: 'synced' };
}
function kayit(animalId: string, medicine: string, recordedAt: string): HealthRecord {
  return { id: `${animalId}-${medicine}-${recordedAt}`, animalId, recordType: 'vaccine', symptoms: '', diagnosis: '', treatment: '', medicine, withdrawalDays: 0, vetName: '', recordedAt, notes: '' };
}

export const planTakvimModul: TestModul = {
  grup: 'Sağlık planı otomatik takvim',
  calistir: () => {
    const g = 'Plan takvimi';
    const plan = { asi: ['karma'], parazit: ['ivermektin'], vitamin: ['selen-e'] };
    const animals = [hayvan('k1', '2026-10-10T08:00:00Z'), hayvan('k2', '2026-10-19T08:00:00Z'), hayvan('k3', '2026-10-01T00:00:00Z', 'sold')];
    const bos = planVadeleri({ animals, health: [], plan, zaman: {}, now: NOW });
    const k1Karma = bos.find((v) => v.animalId === 'k1' && v.programId === 'karma');
    const k2Iver = bos.find((v) => v.animalId === 'k2' && v.programId === 'ivermektin');
    const z = { karma: { gunSonra: 3, tekrarGun: 21 } };
    const ozel = planVadeleri({ animals, health: [], plan, zaman: z, now: NOW }).find((v) => v.animalId === 'k2' && v.programId === 'karma');
    const yapildi = planVadeleri({
      animals,
      health: [kayit('k1', 'Karma aşı', '2026-10-11'), kayit('k1', 'Selenyum + E vitamini', '2026-10-11')],
      plan, zaman: z, now: NOW,
    });
    const k1KarmaSonra = yapildi.find((v) => v.animalId === 'k1' && v.programId === 'karma');
    return [
      test(g, 'parazit varsayılan girişte', varsayilanZaman('ivermektin').gunSonra === 0),
      test(g, 'satılan kuzu takvimde yok', !bos.some((v) => v.animalId === 'k3')),
      test(g, 'yapılmamış doz gecikti olarak görünür', !!k1Karma && k1Karma.kalanGun < 0, JSON.stringify(k1Karma)),
      test(g, 'bugün giren kuzunun ilacı bugün', k2Iver?.kalanGun === 0, JSON.stringify(k2Iver)),
      test(g, 'özel gün sonra uygulanır', ozel?.kalanGun === 3 && ozel.vade === '2026-10-22', JSON.stringify(ozel)),
      test(g, 'yapıldı → tekrar planlanır (21 gün)', k1KarmaSonra?.vade === '2026-11-01' && k1KarmaSonra.dozNo === 2, JSON.stringify(k1KarmaSonra)),
      test(g, 'tek dozluk vitamin yapıldıysa listelenmez', !yapildi.some((v) => v.animalId === 'k1' && v.programId === 'selen-e')),
      test(g, 'özet geciken sayar', (vadeOzeti(bos).get('karma')?.geciken ?? 0) === 1),
      test(g, 'zaman etiketi', zamanEtiketi({ gunSonra: 0, tekrarGun: null }) === 'Girişte · tek doz'),
    ];
  },
};
