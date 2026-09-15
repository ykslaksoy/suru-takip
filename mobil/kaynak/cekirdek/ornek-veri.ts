import {
  adjustStock,
  countAnimals,
  clearAllStorage,
  upsertStockItem,
} from './veritabani';
import { clearAllRationPlans } from '@/kaynak/rasyon/hayvan-plani';
import { kaydetYemSayim, clearAllYemSayim } from '@/kaynak/stok/sayim';
import { kaydetKatalogKullanim, clearKatalogKullanim } from '@/kaynak/stok/kullanim';
import { seedTumEslesikKuzular, ensurePadokKuzuVerisi } from './padok-b-kuzular';

export {
  seedTumEslesikKuzular,
  ensurePadokKuzuVerisi,
  seedPadokAEslesikKuzular,
  seedPadokBEslesikKuzular,
  seedPadokBGrupKuzular,
  seedPadokCGrupKuzular,
  padokBKuzuKimlik,
  padokAKuzuKimlik,
  PADOK_A_KUZU_ADET,
  PADOK_B_KUZU_ADET,
  PADOK_C_KUZU_ADET,
} from './padok-b-kuzular';

/**
 * Boş depoda demo sürü: Padok A (20) + Gözlem (80) + B/C (40) ≈ 140 kuzu.
 * Açık plan ~100 (A+Gözlem); eski B/C bugün ayrı kayıtlarla kapatılır.
 * Mevcut kayıtları asla silmez / üzerine yazmaz (count > 0 → sadece eksik padok merge).
 */
export async function seedDemoDataIfEmpty(): Promise<boolean> {
  const count = await countAnimals();
  if (count > 0) {
    await ensurePadokKuzuVerisi();
    return false;
  }

  const now = new Date();
  const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

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

  await kaydetKatalogKullanim('arpa-kirmasi', 80);
  await kaydetKatalogKullanim('yonca-kuru', 40);
  await kaydetKatalogKullanim('albendazol', 25);
  await kaydetKatalogKullanim('mineral-yalama', 15);
  await kaydetKatalogKullanim('premiks', 12);
  await kaydetKatalogKullanim('clostridial', 10);

  await seedTumEslesikKuzular();

  return true;
}

export async function clearAllData(): Promise<void> {
  await clearAllStorage();
  await clearAllRationPlans();
  await clearAllYemSayim();
  await clearKatalogKullanim();
}
