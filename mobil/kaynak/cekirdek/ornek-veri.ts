import { v4 as uuidv4 } from 'uuid';
import { addHealthRecord, addWeightRecord, countAnimals, clearAllStorage, upsertAnimal, upsertStockItem } from './veritabani';
import { upsertRationPlanFromWeight, clearAllRationPlans } from '@/kaynak/rasyon/hayvan-plani';

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  const count = await countAnimals();
  if (count > 0) return false;

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString().split('T')[0];
  };

  const animals = [
    {
      id: uuidv4(),
      earTag: 'TR-34-001234',
      turkvetNo: 'TR340012345678901',
      name: 'Kızıl',
      breed: 'Merinos',
      sex: 'female' as const,
      birthDate: '2022-03-15',
      paddock: 'Padok A',
      status: 'lactating' as const,
      motherId: null,
      gehisId: null,
      notes: 'Damızlık aday',
    },
    {
      id: uuidv4(),
      earTag: 'TR-34-001235',
      turkvetNo: 'TR340012345678902',
      name: 'Boğa',
      breed: 'İvesi',
      sex: 'male' as const,
      birthDate: '2024-01-10',
      paddock: 'Padok B',
      status: 'healthy' as const,
      motherId: null,
      gehisId: null,
      notes: 'Besi grubu',
    },
    {
      id: uuidv4(),
      earTag: 'TR-34-001236',
      turkvetNo: 'TR340012345678903',
      name: 'Yavrucuk',
      breed: 'Merinos',
      sex: 'female' as const,
      birthDate: daysAgo(45),
      paddock: 'Padok A',
      status: 'healthy' as const,
      motherId: null,
      gehisId: null,
      notes: 'Kuzu',
    },
  ];

  for (const seed of animals) {
    const saved = await upsertAnimal(seed);
    const weights = saved.sex === 'male'
      ? [42, 45, 48, 52]
      : saved.name === 'Yavrucuk'
        ? [12, 15, 18, 22]
        : [62, 64, 66, 68];
    for (let i = 0; i < weights.length; i++) {
      await addWeightRecord({
        animalId: saved.id,
        weightKg: weights[i],
        recordedAt: new Date(now.getTime() - (weights.length - 1 - i) * 7 * 86400000).toISOString(),
        notes: '',
      });
    }
    await upsertRationPlanFromWeight(saved, weights[weights.length - 1]);
  }

  await addHealthRecord({
    animalId: animals[0].id,
    recordType: 'vaccine',
    symptoms: '',
    diagnosis: 'Rutin aşı',
    treatment: 'Clostridial kombine aşı',
    medicine: 'Clostridial aşı',
    withdrawalDays: 0,
    vetName: 'Dr. Ahmet Yılmaz',
    recordedAt: daysAgo(30),
    notes: 'Yıllık aşı programı',
  });

  await addHealthRecord({
    animalId: animals[1].id,
    recordType: 'illness',
    symptoms: 'İshal, iştahsızlık',
    diagnosis: 'Paraziter enfeksiyon şüphesi',
    treatment: 'Albendazol 5 gün',
    medicine: 'Albendazol',
    withdrawalDays: 14,
    vetName: 'Dr. Ahmet Yılmaz',
    recordedAt: daysAgo(5),
    notes: 'Bekletme süresi devam ediyor',
  });

  await upsertStockItem({ name: 'Arpa kırması', type: 'feed', quantity: 120, unit: 'kg', minQuantity: 200, expiryDate: null, notes: 'Günlük yem' });
  await upsertStockItem({ name: 'Clostridial aşı', type: 'vaccine', quantity: 45, unit: 'doz', minQuantity: 20, expiryDate: '2027-12-01', notes: '' });
  await upsertStockItem({ name: 'Albendazol', type: 'medicine', quantity: 8, unit: 'flakon', minQuantity: 5, expiryDate: '2026-06-15', notes: '' });

  return true;
}

export async function clearAllData(): Promise<void> {
  await clearAllStorage();
  await clearAllRationPlans();
}
