/**
 * Padok A/B/C kuzu besi rasyonu — hazır yem + arpa + yonca + saman.
 * Kilo artışı: günlük rasyon / FCR ile gün gün simüle edilir (ADG ↔ FCR tutarlı).
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
export const PADOK_HEDEF_FCR = 5.5;

/**
 * Günlük as-fed rasyon (kg/hayvan).
 * Hazır+arpa+yonca+saman karışımında kaba yem hacmiyle ~%6 CA;
 * 17 kg kuzuya 0,8 yetmez — taban 1,3 kg.
 */
export function padokGunlukRasyonKg(canliAgirlikKg: number): number {
  const ham = canliAgirlikKg * 0.06 + 0.25;
  return Math.round(Math.min(2.4, Math.max(1.3, ham)) * 10) / 10;
}

export type PadokDonemSim = {
  baslangicKg: number;
  gun: number;
  bitisKg: number;
  artisKg: number;
  /** Dönem ort. günlük rasyon (kg) */
  ortGunlukRasyonKg: number;
  /** Ort. ADG (g/gün) — calculateADG ile aynı birim */
  adgGram: number;
  toplamYemKg: number;
};

/** Günlük rasyon arttıkça kilo da artar — giriş rasyonu × gün yanlış ADG/FCR üretir. */
export function padokDonemSimulasyonu(baslangicKg: number, gun: number): PadokDonemSim {
  if (gun <= 0) {
    const g = padokGunlukRasyonKg(baslangicKg);
    return {
      baslangicKg,
      gun: 0,
      bitisKg: baslangicKg,
      artisKg: 0,
      ortGunlukRasyonKg: g,
      adgGram: 0,
      toplamYemKg: 0,
    };
  }
  let w = baslangicKg;
  let toplamYem = 0;
  for (let d = 0; d < gun; d++) {
    const feed = padokGunlukRasyonKg(w);
    toplamYem += feed;
    w += feed / PADOK_HEDEF_FCR;
  }
  const artisKg = Math.round((w - baslangicKg) * 10) / 10;
  const bitisKg = Math.round(w * 10) / 10;
  const ortGunlukRasyonKg = Math.round((toplamYem / gun) * 100) / 100;
  const adgGram = Math.round((artisKg / gun) * 1000);
  return {
    baslangicKg,
    gun,
    bitisKg,
    artisKg,
    ortGunlukRasyonKg,
    adgGram,
    toplamYemKg: Math.round(toplamYem * 10) / 10,
  };
}

/** Simülasyon sonrası belirli gündeki canlı ağırlık (kg). */
export function padokAgirlikGun(baslangicKg: number, gecenGun: number): number {
  if (gecenGun <= 0) return baslangicKg;
  return padokDonemSimulasyonu(baslangicKg, gecenGun).bitisKg;
}

/** Beklenen dönem artışı (kg) — simülasyon. */
export function padokBeklenenArtisKg(girisKg: number, gun: number): number {
  return padokDonemSimulasyonu(girisKg, gun).artisKg;
}

/** Dönem ort. ADG (g/gün). */
export function padokBeklenenAdgGram(girisKg: number, gun: number): number {
  return padokDonemSimulasyonu(girisKg, gun).adgGram;
}

/** FCR penceresi için ort. günlük verilen yem (kg). */
export function padokDonemOrtGunlukRasyon(baslangicKg: number, gun: number): number {
  return padokDonemSimulasyonu(baslangicKg, gun).ortGunlukRasyonKg;
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
    // Güncel tartım ağırlığına göre bugünkü rasyon; FCR geçmiş dönemde ort. ile hesaplanır.
    await setDailyGivenKg(a.id, padokGunlukRasyonKg(w));
    n += 1;
  }
  return n;
}

export function padokRasyonNotu(girisKg: number, gun: number): string {
  const sim = padokDonemSimulasyonu(girisKg, gun);
  const bilesen = padokRasyonGunlukBilesenler(girisKg)
    .map((b) => `${b.ad} ${b.kgGun} kg`)
    .join(' + ');
  return (
    `Rasyon ~${sim.ortGunlukRasyonKg} kg/gün ort. (FCR ${PADOK_HEDEF_FCR}) · ${bilesen} · ` +
    `${gun}g +${sim.artisKg} kg · ADG ~${sim.adgGram} g/gün`
  );
}

export async function hayvanRasyonOzeti(a: Animal): Promise<string | null> {
  const plan = await getAnimalRationPlan(a.id);
  if (!plan) return null;
  const kg = plan.dailyGivenKg ?? plan.dailyFeedKg;
  return `${kg} kg/gün · hazır %50 + arpa %25 + yonca %15 + saman %10 · FCR~${PADOK_HEDEF_FCR}`;
}
