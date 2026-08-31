/**
 * Padok A/B/C kuzu besi rasyonu — hazır yem + arpa + yonca + saman.
 * Kilo artışı: günlük verilen / hedef FCR (rasyon yokken sabit ADG kullanılıyordu).
 */

import { v4 as uuidv4 } from 'uuid';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals, getLatestWeight, upsertStockItem } from '@/kaynak/cekirdek/veritabani';
import { upsertKullaniciRasyon } from '@/kaynak/rasyon/kullanici-rasyon';
import {
  getAnimalRationPlan,
  setDailyGivenKg,
  upsertRationPlanFromWeight,
} from '@/kaynak/rasyon/hayvan-plani';
import { kaydetKatalogKullanim } from '@/kaynak/stok/kullanim';
import {
  ESLESIK_KUZU_PADOK_A,
  ESLESIK_KUZU_PADOK_B,
  ESLESIK_KUZU_PADOK_C,
} from './padok-b-kuzular';

export const PADOK_RASYON_ID = 'padok-kuzu-besi-rasyon-v1';

/** Karışım payları (kg/kg rasyon) */
export const PADOK_RASYON_BILESENLER = [
  { katalogId: 'fabrika-kuzu', ad: 'Hazır kuzu besi yemi', pay: 0.5, fiyatKg: 18 },
  { katalogId: 'arpa-kirmasi', ad: 'Arpa kırması', pay: 0.25, fiyatKg: 9 },
  { katalogId: 'yonca-kuru', ad: 'Yonca kuru ot', pay: 0.15, fiyatKg: 7 },
  { katalogId: 'saman-bugday', ad: 'Buğday samanı', pay: 0.1, fiyatKg: 3 },
] as const;

/** Bu karışım için hedef yem dönüşümü (kg yem / kg canlı ağırlık artışı) */
export const PADOK_HEDEF_FCR = 4.8;

/** Canlı ağırlığın ~%3,8’i + taban (kg/gün as-fed) */
export function padokGunlukRasyonKg(canliAgirlikKg: number): number {
  const ham = canliAgirlikKg * 0.038 + 0.12;
  return Math.round(Math.min(1.4, Math.max(0.75, ham)) * 10) / 10;
}

/** Beklenen dönem artışı (kg) — rasyon × gün / FCR */
export function padokBeklenenArtisKg(girisKg: number, gun: number): number {
  const gunluk = padokGunlukRasyonKg(girisKg);
  return Math.round(((gunluk / PADOK_HEDEF_FCR) * gun) * 10) / 10;
}

/** Bileşen kg/gün (hayvan başına) */
export function padokRasyonGunlukBilesenler(canliAgirlikKg: number): {
  ad: string;
  katalogId: string;
  kgGun: number;
  fiyatKg: number;
}[] {
  const toplam = padokGunlukRasyonKg(canliAgirlikKg);
  return PADOK_RASYON_BILESENLER.map((b) => ({
    ad: b.ad,
    katalogId: b.katalogId,
    kgGun: Math.round(toplam * b.pay * 100) / 100,
    fiyatKg: b.fiyatKg,
  }));
}

export async function seedPadokKuzuRasyonTarifi(): Promise<void> {
  // Örnek 22 kg kuzu için günlük tarif (Benim rasyonum)
  const ornekKg = 22;
  const bilesenler = padokRasyonGunlukBilesenler(ornekKg).map((b) => ({
    id: uuidv4(),
    ad: b.ad,
    miktarKg: b.kgGun,
    fiyatKg: b.fiyatKg,
  }));
  await upsertKullaniciRasyon({
    id: PADOK_RASYON_ID,
    ad: 'Padok kuzu besi (hazır+arpa+yonca+saman)',
    bilesenler,
  });
}

export async function seedPadokRasyonStoklari(): Promise<void> {
  const stoklar = [
    { name: 'Hazır kuzu besi yemi', quantity: 800, min: 150, notes: 'fabrika-kuzu · padok besi' },
    { name: 'Arpa kırması', quantity: 600, min: 150, notes: 'arpa-kirmasi · padok besi' },
    { name: 'Yonca kuru ot', quantity: 400, min: 80, notes: 'yonca-kuru · padok besi' },
    { name: 'Buğday samanı', quantity: 500, min: 100, notes: 'saman-bugday · padok besi' },
  ];
  for (const s of stoklar) {
    await upsertStockItem({
      name: s.name,
      type: 'feed',
      quantity: s.quantity,
      unit: 'kg',
      minQuantity: s.min,
      expiryDate: null,
      notes: s.notes,
    });
  }
  await kaydetKatalogKullanim('fabrika-kuzu', 90);
  await kaydetKatalogKullanim('arpa-kirmasi', 70);
  await kaydetKatalogKullanim('yonca-kuru', 50);
  await kaydetKatalogKullanim('saman-bugday', 40);
}

/** Hayvan planına rasyon karışımından günlük verilen kg yaz */
export async function seedPadokHayvanRasyonPlanlari(): Promise<number> {
  const padoklar = new Set([ESLESIK_KUZU_PADOK_A, ESLESIK_KUZU_PADOK_B, ESLESIK_KUZU_PADOK_C]);
  const animals = (await getAnimals()).filter((a) => padoklar.has(a.paddock));
  let n = 0;
  for (const a of animals) {
    const w = await getLatestWeight(a.id);
    if (w == null || w <= 0) continue;
    await upsertRationPlanFromWeight(a, w);
    const gunluk = padokGunlukRasyonKg(w);
    await setDailyGivenKg(a.id, gunluk);
    n += 1;
  }
  return n;
}

export function padokRasyonNotu(girisKg: number, gun: number): string {
  const gunluk = padokGunlukRasyonKg(girisKg);
  const artis = padokBeklenenArtisKg(girisKg, gun);
  const bilesen = padokRasyonGunlukBilesenler(girisKg)
    .map((b) => `${b.ad} ${b.kgGun} kg`)
    .join(' + ');
  return (
    `Rasyon ~${gunluk} kg/gün (FCR ${PADOK_HEDEF_FCR}) · ${bilesen} · ` +
    `${gun}g beklenen +${artis} kg`
  );
}

export async function hayvanRasyonOzeti(a: Animal): Promise<string | null> {
  const plan = await getAnimalRationPlan(a.id);
  if (!plan) return null;
  const kg = plan.dailyGivenKg ?? plan.dailyFeedKg;
  return `${kg} kg/gün · hazır %50 + arpa %25 + yonca %15 + saman %10 · FCR~${PADOK_HEDEF_FCR}`;
}
