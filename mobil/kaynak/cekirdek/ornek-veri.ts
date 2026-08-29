import { v4 as uuidv4 } from 'uuid';
import {
  addHealthRecord,
  addWeightRecord,
  adjustStock,
  countAnimals,
  clearAllStorage,
  upsertAnimal,
  upsertStockItem,
} from './veritabani';
import { upsertRationPlanFromWeight, clearAllRationPlans } from '@/kaynak/rasyon/hayvan-plani';
import { kaydetYemSayim, clearAllYemSayim } from '@/kaynak/stok/sayim';
import { kaydetKatalogKullanim, clearKatalogKullanim } from '@/kaynak/stok/kullanim';
import { seedPadokBEslesikKuzular } from './padok-b-kuzular';

export { seedPadokBEslesikKuzular, padokBKuzuKimlik, PADOK_B_KUZU_ADET } from './padok-b-kuzular';

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  const count = await countAnimals();
  if (count > 0) {
    // Mevcut kurulumda da Padok B eşleşik 20 kuzu garantile
    await seedPadokBEslesikKuzular();
    return false;
  }

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString().split('T')[0];
  };
  const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const animals = [
    {
      id: uuidv4(),
      earTag: 'TR-34-001234',
      turkvetNo: 'TR340012345678901',
      name: 'Kızıl',
      breed: 'Merinos',
      species: 'sheep' as const,
      sex: 'female' as const,
      birthDate: '2022-03-15',
      paddock: 'Padok A',
      status: 'lactating' as const,
      motherId: null,
      gehisId: null,
      sirtNo: null,
      modId: 'mod3' as const,
      notes: 'Damızlık aday',
      createdAt: isoDaysAgo(20),
    },
    {
      id: uuidv4(),
      earTag: 'TR-34-001235',
      turkvetNo: 'TR340012345678902',
      name: 'Boğa',
      breed: 'İvesi',
      species: 'sheep' as const,
      sex: 'male' as const,
      birthDate: '2024-01-10',
      paddock: 'Padok B',
      status: 'healthy' as const,
      motherId: null,
      gehisId: null,
      sirtNo: null,
      modId: 'mod1' as const,
      notes: 'Besi grubu · karantina tamam',
      createdAt: isoDaysAgo(12),
    },
    {
      id: uuidv4(),
      earTag: 'TR-34-001236',
      turkvetNo: 'TR340012345678903',
      name: 'Yavrucuk',
      breed: 'Merinos',
      species: 'sheep' as const,
      sex: 'female' as const,
      birthDate: daysAgo(45),
      paddock: 'Padok A',
      status: 'healthy' as const,
      motherId: null,
      gehisId: null,
      sirtNo: null,
      modId: 'mod1' as const,
      notes: 'Kuzu · alım sonrası karantina',
      createdAt: isoDaysAgo(8),
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
    animalId: animals[2].id,
    recordType: 'vaccine',
    symptoms: '',
    diagnosis: 'Alım sonrası aşı',
    treatment: 'Clostridial kombine aşı',
    medicine: 'Clostridial aşı',
    withdrawalDays: 0,
    vetName: 'Dr. Ahmet Yılmaz',
    recordedAt: daysAgo(6),
    notes: 'Karantina sonrası',
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

  const feed = await upsertStockItem({
    name: 'Arpa kırması',
    type: 'feed',
    quantity: 500,
    unit: 'kg',
    minQuantity: 200,
    expiryDate: null,
    notes: 'Günlük yem',
  });
  await kaydetYemSayim(feed.id, 500, 'dönem başı sayım', isoDaysAgo(22));
  await adjustStock(feed.id, 'out', 36, 'Padok A');
  await adjustStock(feed.id, 'out', 30, 'Padok B');
  await upsertStockItem({ ...feed, quantity: 120 });
  await kaydetYemSayim(feed.id, 120, 'son sayım', isoDaysAgo(1));

  await upsertStockItem({
    name: 'Clostridial aşı',
    type: 'vaccine',
    quantity: 1,
    unit: 'doz',
    minQuantity: 20,
    expiryDate: '2027-12-01',
    notes: 'Demo: yapılacak aşıya göre stok düşük',
  });
  await upsertStockItem({
    name: 'Enterotoksemi aşısı',
    type: 'vaccine',
    quantity: 0,
    unit: 'doz',
    minQuantity: 10,
    expiryDate: '2026-11-01',
    notes: 'Demo: stok yok',
  });
  await upsertStockItem({ name: 'Albendazol', type: 'medicine', quantity: 8, unit: 'flakon', minQuantity: 5, expiryDate: '2026-06-15', notes: '' });
  await upsertStockItem({
    name: 'Mineral yalama taşı',
    type: 'supplement',
    quantity: 1,
    unit: 'adet',
    minQuantity: 2,
    expiryDate: null,
    notes: 'Padok A',
  });
  await upsertStockItem({
    name: 'Vitamin-mineral premiks',
    type: 'supplement',
    quantity: 12,
    unit: 'kg',
    minQuantity: 5,
    expiryDate: '2026-10-01',
    notes: 'Yeme karışım',
  });
  await upsertStockItem({
    name: 'Hayvan tuzu',
    type: 'supplement',
    quantity: 25,
    unit: 'kg',
    minQuantity: 10,
    expiryDate: null,
    notes: '',
  });

  // Kullanım skorları — demo sıralama (çok kullanılan üstte)
  await kaydetKatalogKullanim('arpa-kirmasi', 80);
  await kaydetKatalogKullanim('yonca-kuru', 40);
  await kaydetKatalogKullanim('albendazol', 25);
  await kaydetKatalogKullanim('mineral-yalama', 15);
  await kaydetKatalogKullanim('premiks', 12);
  await kaydetKatalogKullanim('clostridial', 10);

  await seedPadokBEslesikKuzular();

  return true;
}

export async function clearAllData(): Promise<void> {
  await clearAllStorage();
  await clearAllRationPlans();
  await clearAllYemSayim();
  await clearKatalogKullanim();
}
