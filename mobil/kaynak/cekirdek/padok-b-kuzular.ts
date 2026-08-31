/**
 * Eşleşik kuzu seed’leri — Padok A + B + C.
 *
 * Padok A: ~2–2,5 ay · 17–24 kg · 9–12 bin ₺
 * Padok B: ~3,5 ay · giriş 1 ay önce · ~5,5–7,5 kg artış (~180–250 g/gün)
 * Padok C: 4,5 ay · giriş 2 ay önce · ~11–14 kg artış (~180–230 g/gün)
 */

import { addWeightRecord, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanKayitAdi } from '@/kaynak/cekirdek/hayvan-etiket';
import { ensureVarsayilanPadoklar } from '@/kaynak/suru/padok';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { seedPadokHayvanKayitlari } from './padok-kuzu-kayitlar';

export const PADOK_A_KUZU_ADET = 20;
export const PADOK_B_KUZU_ADET = 20;
export const PADOK_C_KUZU_ADET = 20;
export const ESLESIK_KUZU_PADOK_A = 'Padok A';
export const ESLESIK_KUZU_PADOK_B = 'Padok B';
export const ESLESIK_KUZU_PADOK_C = 'Padok C';

/** @deprecated Eski ad — Padok A */
export const PADOK_B_AD = ESLESIK_KUZU_PADOK_A;
/** @deprecated */
export const ESLESIK_KUZU_PADOK = ESLESIK_KUZU_PADOK_A;

function oran(sira: number, adet: number): number {
  return (sira - 1) / Math.max(1, adet - 1);
}

function gunOnce(now: Date, gun: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - gun);
  return d.toISOString().split('T')[0];
}

function isoOnce(now: Date, gun: number): string {
  return new Date(now.getTime() - gun * 86400000).toISOString();
}

// ——— Padok A ———

export function padokAKuzuKimlik(sira: number) {
  if (sira < 1 || sira > PADOK_A_KUZU_ADET) throw new Error(`Sıra 1–${PADOK_A_KUZU_ADET}`);
  const t = oran(sira, PADOK_A_KUZU_ADET);
  const yasGun = Math.round(60 + t * 15);
  const weightKg = Math.round((17 + t * 7) * 10) / 10;
  const alimFiyat = Math.round((9000 + t * 3000) / 50) * 50;
  const pad = String(sira).padStart(2, '0');
  return {
    id: `padok-a-kuzu-${pad}`,
    sirtNo: String(sira),
    earTag: `TR-34-${String(200000 + sira)}`,
    arefId: `AREF${String(sira).padStart(12, '0')}`,
    turkvetNo: `TR34${String(9000000000000 + sira)}`,
    yasGun,
    weightKg,
    alimFiyat,
  };
}

/** @deprecated */
export const padokBKuzuKimlik = padokAKuzuKimlik;

export async function seedPadokAEslesikKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();

  for (let sira = 1; sira <= PADOK_A_KUZU_ADET; sira++) {
    const k = padokAKuzuKimlik(sira);
    const sex = sira % 2 === 0 ? 'male' : 'female';
    await upsertAnimal({
      id: k.id,
      earTag: k.earTag,
      turkvetNo: k.turkvetNo,
      name: hayvanKayitAdi({ earTag: k.earTag, sirtNo: k.sirtNo }),
      breed: 'Merinos',
      species: 'sheep',
      sex,
      birthDate: gunOnce(now, k.yasGun),
      paddock: ESLESIK_KUZU_PADOK_A,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      notes:
        `Eşleşik: Sırt ${k.sirtNo} · Küpe ${k.earTag} · Aref ${k.arefId} · ` +
        `${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ~${(k.yasGun / 30).toFixed(1)} ay`,
    });
    await addWeightRecord({
      id: `${k.id}-alim-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Alım tartımı · ${k.alimFiyat} ₺`,
    });
  }

  return { adet: PADOK_A_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_A };
}

/** @deprecated Eski ad — Padok A */
export const seedPadokBEslesikKuzular = seedPadokAEslesikKuzular;

// ——— Padok B (3,5 ay · giriş 1 ay önce) ———

export function padokBGrupKimlik(sira: number) {
  if (sira < 1 || sira > PADOK_B_KUZU_ADET) throw new Error(`Sıra 1–${PADOK_B_KUZU_ADET}`);
  const t = oran(sira, PADOK_B_KUZU_ADET);
  const yasGun = Math.round(100 + t * 10);
  const girisGunOnce = 30;
  const girisKg = Math.round((17 + t * 7) * 10) / 10; // giriş: 17–24 kg
  const artisKg = Math.round((5.5 + t * 2) * 10) / 10; // 1 ay: 5,5–7,5 kg
  const weightKg = Math.round((girisKg + artisKg) * 10) / 10;
  const alimFiyat = Math.round((9000 + t * 3000) / 50) * 50;
  const pad = String(sira).padStart(2, '0');
  return {
    id: `padok-b-grup-${pad}`,
    sirtNo: String(20 + sira),
    earTag: `TR-34-${String(300000 + sira)}`,
    arefId: `AREF${String(100 + sira).padStart(12, '0')}`,
    turkvetNo: `TR34${String(9100000000000 + sira)}`,
    yasGun,
    girisGunOnce,
    weightKg,
    girisKg,
    artisKg,
    alimFiyat,
  };
}

export async function seedPadokBGrupKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();
  const girisIso = isoOnce(now, 30);
  const girisTarih = gunOnce(now, 30);

  for (let sira = 1; sira <= PADOK_B_KUZU_ADET; sira++) {
    const k = padokBGrupKimlik(sira);
    const sex = sira % 3 === 0 ? 'male' : 'female';
    const animal: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> &
      Partial<Pick<Animal, 'createdAt'>> = {
      id: k.id,
      earTag: k.earTag,
      turkvetNo: k.turkvetNo,
      name: hayvanKayitAdi({ earTag: k.earTag, sirtNo: k.sirtNo }),
      breed: 'Merinos',
      species: 'sheep',
      sex,
      birthDate: gunOnce(now, k.yasGun),
      paddock: ESLESIK_KUZU_PADOK_B,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      createdAt: girisIso,
      notes:
        `Eşleşik: Sırt ${k.sirtNo} · Küpe ${k.earTag} · Aref ${k.arefId} · ` +
        `Giriş ${girisTarih} (1 aydır bakılıyor) · Giriş ${k.girisKg} kg → +${k.artisKg} kg → ` +
        `Şimdi ${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ~3,5 ay`,
    };
    await upsertAnimal(animal);
    await addWeightRecord({
      id: `${k.id}-giris-tartim`,
      animalId: k.id,
      weightKg: k.girisKg,
      recordedAt: girisIso,
      notes: `Giriş tartımı · ${k.alimFiyat} ₺ · ${girisTarih}`,
    });
    await addWeightRecord({
      id: `${k.id}-guncel-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Güncel tartım · 1 aylık artış +${k.artisKg} kg`,
    });
  }

  return { adet: PADOK_B_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_B };
}

// ——— Padok C (4,5 aylık · giriş 2 ay önce · kilo 2 ay artmış) ———

export function padokCGrupKimlik(sira: number) {
  if (sira < 1 || sira > PADOK_C_KUZU_ADET) throw new Error(`Sıra 1–${PADOK_C_KUZU_ADET}`);
  const t = oran(sira, PADOK_C_KUZU_ADET);
  const girisGunOnce = 60; // 2 ay önce
  // Şu an 4,5 aylık (~135 gün); giriş 2 ay önce → girişte ~2,5 ay
  const yasGun = 135;
  const girisKg = Math.round((17 + t * 7) * 10) / 10; // giriş: 17–24 kg
  const artisKg = Math.round((11 + t * 3) * 10) / 10; // 2 ay: 11–14 kg (~180–230 g/gün)
  const weightKg = Math.round((girisKg + artisKg) * 10) / 10;
  const alimFiyat = Math.round((9000 + t * 3000) / 50) * 50;
  const pad = String(sira).padStart(2, '0');
  return {
    id: `padok-c-grup-${pad}`,
    sirtNo: String(40 + sira), // 41–60
    earTag: `TR-34-${String(400000 + sira)}`,
    arefId: `AREF${String(200 + sira).padStart(12, '0')}`,
    turkvetNo: `TR34${String(9200000000000 + sira)}`,
    yasGun,
    girisGunOnce,
    girisKg,
    artisKg,
    weightKg,
    alimFiyat,
  };
}

/**
 * Padok C: 20 kuzu · 4,5 aylık · giriş 2 ay önce · güncel = giriş + 11–14 kg artış.
 */
export async function seedPadokCGrupKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();
  const girisIso = isoOnce(now, 60);
  const girisTarih = gunOnce(now, 60);

  for (let sira = 1; sira <= PADOK_C_KUZU_ADET; sira++) {
    const k = padokCGrupKimlik(sira);
    const sex = sira % 2 === 1 ? 'male' : 'female';
    const animal: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> &
      Partial<Pick<Animal, 'createdAt'>> = {
      id: k.id,
      earTag: k.earTag,
      turkvetNo: k.turkvetNo,
      name: hayvanKayitAdi({ earTag: k.earTag, sirtNo: k.sirtNo }),
      breed: 'Merinos',
      species: 'sheep',
      sex,
      birthDate: gunOnce(now, k.yasGun),
      paddock: ESLESIK_KUZU_PADOK_C,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      createdAt: girisIso,
      notes:
        `Eşleşik: Sırt ${k.sirtNo} · Küpe ${k.earTag} · Aref ${k.arefId} · ` +
        `Giriş ${girisTarih} (2 aydır bakılıyor) · Giriş ${k.girisKg} kg → +${k.artisKg} kg → ` +
        `Şimdi ${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · 4,5 aylık`,
    };
    await upsertAnimal(animal);
    await addWeightRecord({
      id: `${k.id}-giris-tartim`,
      animalId: k.id,
      weightKg: k.girisKg,
      recordedAt: girisIso,
      notes: `Giriş tartımı · ${k.alimFiyat} ₺ · ${girisTarih}`,
    });
    await addWeightRecord({
      id: `${k.id}-guncel-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Güncel tartım · 2 aylık artış +${k.artisKg} kg`,
    });
  }

  return { adet: PADOK_C_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_C };
}

/** Padok A + B + C + aşı/tartım/FCR kayıtları */
export async function seedTumEslesikKuzular(): Promise<void> {
  await seedPadokAEslesikKuzular();
  await seedPadokBGrupKuzular();
  await seedPadokCGrupKuzular();
  await seedPadokHayvanKayitlari();
}
