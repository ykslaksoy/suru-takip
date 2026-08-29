/**
 * Eşleşik 20 kuzu — Padok A.
 * Her kuzuda aynı sıra: sırt no · kulak küpe · Aref (GEKİS) ID.
 * Yaş 2–2,5 ay · canlı ağırlık 17–24 kg · alım fiyatı 9.000–12.000 ₺ (kilo ile).
 */

import { addWeightRecord, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { ensureVarsayilanPadoklar } from '@/kaynak/suru/padok';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export const PADOK_B_KUZU_ADET = 20;
/** Bu grup Padok A'da; Padok B'ye sonra başka kuzular eklenecek */
export const PADOK_B_AD = 'Padok A';
export const ESLESIK_KUZU_PADOK = 'Padok A';

const YAS_GUN_MIN = 60; // ~2 ay
const YAS_GUN_MAX = 75; // ~2,5 ay
const KG_MIN = 17;
const KG_MAX = 24;
const FIYAT_MIN = 9000;
const FIYAT_MAX = 12000;

/** Sıra → eşleşik kimlikler (aynı kuzu) */
export function padokBKuzuKimlik(sira: number): {
  id: string;
  sirtNo: string;
  earTag: string;
  arefId: string;
  turkvetNo: string;
  yasGun: number;
  weightKg: number;
  alimFiyat: number;
} {
  if (sira < 1 || sira > PADOK_B_KUZU_ADET) {
    throw new Error(`Sıra 1–${PADOK_B_KUZU_ADET} olmalı`);
  }
  const pad = String(sira).padStart(2, '0');
  const t = PADOK_B_KUZU_ADET === 1 ? 0 : (sira - 1) / (PADOK_B_KUZU_ADET - 1);
  const yasGun = Math.round(YAS_GUN_MIN + t * (YAS_GUN_MAX - YAS_GUN_MIN));
  const weightKg = Math.round((KG_MIN + t * (KG_MAX - KG_MIN)) * 10) / 10;
  const alimFiyat = Math.round((FIYAT_MIN + t * (FIYAT_MAX - FIYAT_MIN)) / 50) * 50;
  const sirtNo = String(sira);
  const earTag = `TR-34-${String(200000 + sira)}`;
  const arefId = `AREF${String(sira).padStart(12, '0')}`;
  const turkvetNo = `TR34${String(9000000000000 + sira)}`;
  return {
    id: `padok-b-kuzu-${pad}`,
    sirtNo,
    earTag,
    arefId,
    turkvetNo,
    yasGun,
    weightKg,
    alimFiyat,
  };
}

/**
 * 20 eşleşik kuzuyu Padok A'ya yazar (idempotent).
 * Yaş, tartım ve alım fiyatı kilo bandına göre atanır.
 */
export async function seedPadokBEslesikKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString().split('T')[0];
  };

  for (let sira = 1; sira <= PADOK_B_KUZU_ADET; sira++) {
    const k = padokBKuzuKimlik(sira);
    const sex = sira % 2 === 0 ? 'male' : 'female';
    const animal: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> = {
      id: k.id,
      earTag: k.earTag,
      turkvetNo: k.turkvetNo,
      name: `Kuzu Sırt-${k.sirtNo}`,
      breed: 'Merinos',
      species: 'sheep',
      sex,
      birthDate: daysAgo(k.yasGun),
      paddock: ESLESIK_KUZU_PADOK,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      notes:
        `Eşleşik: Sırt ${k.sirtNo} · Küpe ${k.earTag} · Aref ${k.arefId} · ` +
        `${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ~${(k.yasGun / 30).toFixed(1)} ay`,
    };
    await upsertAnimal(animal);
    await addWeightRecord({
      id: `${k.id}-alim-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Alım tartımı · ${k.alimFiyat} ₺`,
    });
  }

  return { adet: PADOK_B_KUZU_ADET, padok: ESLESIK_KUZU_PADOK };
}
