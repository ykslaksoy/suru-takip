/**
 * Padok B — 20 eşleşik kuzu.
 * Her kuzuda aynı sıra numarası: sırt no · kulak küpe · Aref (GEKİS) ID.
 */

import { upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { ensureVarsayilanPadoklar } from '@/kaynak/suru/padok';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export const PADOK_B_KUZU_ADET = 20;
export const PADOK_B_AD = 'Padok B';

/** Sıra → eşleşik kimlikler (aynı kuzu) */
export function padokBKuzuKimlik(sira: number): {
  id: string;
  sirtNo: string;
  earTag: string;
  arefId: string;
  turkvetNo: string;
} {
  if (sira < 1 || sira > PADOK_B_KUZU_ADET) {
    throw new Error(`Sıra 1–${PADOK_B_KUZU_ADET} olmalı`);
  }
  const pad = String(sira).padStart(2, '0');
  const sirtNo = String(sira);
  const earTag = `TR-34-${String(200000 + sira)}`; // TR-34-200001 … 200020
  const arefId = `AREF${String(sira).padStart(12, '0')}`; // AREF000000000001 …
  const turkvetNo = `TR34${String(9000000000000 + sira)}`; // 17 karakter
  return {
    id: `padok-b-kuzu-${pad}`,
    sirtNo,
    earTag,
    arefId,
    turkvetNo,
  };
}

/**
 * 20 kuzuyu Padok B'ye yazar (idempotent — sabit id ile upsert).
 * @returns yazılan / güncellenen adet
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
      birthDate: daysAgo(60 + sira),
      paddock: PADOK_B_AD,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      notes: `Eşleşik: Sırt ${k.sirtNo} · Küpe ${k.earTag} · Aref ${k.arefId}`,
    };
    await upsertAnimal(animal);
  }

  return { adet: PADOK_B_KUZU_ADET, padok: PADOK_B_AD };
}
