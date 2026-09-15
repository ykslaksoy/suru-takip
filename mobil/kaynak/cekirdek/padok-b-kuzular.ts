/**
 * Eşleşik kuzu seed’leri — Padok A + B + C.
 *
 * Padok A: ~2–2,5 ay · 17–24 kg · 9–12 bin ₺
 * Padok B: ~3,5 ay · giriş 1 ay önce · ~5–6,5 kg / 30 gün (rasyon simülasyonu)
 * Padok C: 4,5 ay · giriş 2 ay önce · 15g tartım · ~12–13 kg / 60 gün
 */

import { addWeightRecord, getAnimals, getWeightRecords, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanKayitAdi } from '@/kaynak/cekirdek/hayvan-etiket';
import { ensureVarsayilanPadoklar, GOZLEM_PADOK_AD } from '@/kaynak/suru/padok';
import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { seedPadokHayvanKayitlari } from './padok-kuzu-kayitlar';
import { padokAgirlikGun, padokBeklenenArtisKg, padokRasyonNotu } from './padok-rasyon';

/** Mevcut tartımın tarihini koru; kilo revizyonunda kg güncelle */
async function yazTartimEgerYok(
  record: Omit<WeightRecord, 'id'> & { id: string },
): Promise<void> {
  const mevcut = await getWeightRecords(record.animalId);
  const eski = mevcut.find((r) => r.id === record.id);
  if (eski) {
    if (eski.weightKg === record.weightKg) return;
    await addWeightRecord({
      ...record,
      recordedAt: eski.recordedAt,
      notes: record.notes,
    });
    return;
  }
  await addWeightRecord(record);
}

export const PADOK_A_KUZU_ADET = 20;
export const PADOK_B_KUZU_ADET = 20;
export const PADOK_C_KUZU_ADET = 20;
/** Gözlem ilk gelen — A (20) + Gözlem (80) ≈ 100 açık plan */
export const GOZLEM_KUZU_ADET = 80;
export const ESLESIK_KUZU_PADOK_A = 'Padok A';
export const ESLESIK_KUZU_PADOK_B = 'Padok B';
export const ESLESIK_KUZU_PADOK_C = 'Padok C';
export const ESLESIK_KUZU_PADOK_GOZLEM = GOZLEM_PADOK_AD;

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
        `${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ~${(k.yasGun / 30).toFixed(1)} ay · ` +
        `Rasyon: hazır kuzu yemi + arpa + yonca + saman (yeni alım)`,
    });
    await yazTartimEgerYok({
      id: `${k.id}-alim-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Alım tartımı · ${k.alimFiyat} ₺`,
    });
  }

  return { adet: PADOK_A_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_A };
}

/** Gözlem — ilk gelen açık plan (~80; A ile birlikte ~100) */
export function padokGozlemKimlik(sira: number) {
  if (sira < 1 || sira > GOZLEM_KUZU_ADET) throw new Error(`Sıra 1–${GOZLEM_KUZU_ADET}`);
  const t = oran(sira, GOZLEM_KUZU_ADET);
  const yasGun = Math.round(60 + t * 20);
  const weightKg = Math.round((17 + t * 7) * 10) / 10;
  const alimFiyat = Math.round((9000 + t * 3000) / 50) * 50;
  const pad = String(sira).padStart(2, '0');
  return {
    id: `gozlem-kuzu-${pad}`,
    sirtNo: String(100 + sira),
    earTag: `TR-34-${String(400000 + sira)}`,
    arefId: `AREF${String(400 + sira).padStart(12, '0')}`,
    turkvetNo: `TR34${String(9200000000000 + sira)}`,
    yasGun,
    weightKg,
    alimFiyat,
  };
}

export async function seedGozlemEslesikKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();

  for (let sira = 1; sira <= GOZLEM_KUZU_ADET; sira++) {
    const k = padokGozlemKimlik(sira);
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
      paddock: ESLESIK_KUZU_PADOK_GOZLEM,
      status: 'healthy',
      motherId: null,
      gehisId: k.arefId,
      sirtNo: k.sirtNo,
      modId: 'mod1',
      notes:
        `Gözlem ilk gelen: Sırt ${k.sirtNo} · Küpe ${k.earTag} · ` +
        `${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ` +
        `Açık aşı/yem planı satılana kadar`,
    });
    await yazTartimEgerYok({
      id: `${k.id}-alim-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Alım tartımı · Gözlem · ${k.alimFiyat} ₺`,
    });
  }

  return { adet: GOZLEM_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_GOZLEM };
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
  const artisKg = padokBeklenenArtisKg(girisKg, girisGunOnce);
  const weightKg = padokAgirlikGun(girisKg, girisGunOnce);
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
        `Şimdi ${k.weightKg} kg · Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · ~3,5 ay · ` +
        padokRasyonNotu(k.girisKg, 30),
    };
    await upsertAnimal(animal);
    await yazTartimEgerYok({
      id: `${k.id}-giris-tartim`,
      animalId: k.id,
      weightKg: k.girisKg,
      recordedAt: girisIso,
      notes: `Giriş tartımı · ${k.alimFiyat} ₺ · ${girisTarih}`,
    });
    await yazTartimEgerYok({
      id: `${k.id}-guncel-tartim`,
      animalId: k.id,
      weightKg: k.weightKg,
      recordedAt: now.toISOString(),
      notes: `Güncel tartım · 1 aylık artış +${k.artisKg} kg`,
    });
  }

  return { adet: PADOK_B_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_B };
}

// ——— Padok C (4,5 aylık · giriş 2 ay önce · 15 günde bir tartım) ———

/** Padok C: 60 günde 15 günde bir tartım (giriş → +15 → +30 → +45 → güncel) */
export const PADOK_C_TARTIM_ARALIK_GUN = 15;
export const PADOK_C_TARTIM_DONEM_GUN = 60;

export function padokCGrupKimlik(sira: number) {
  if (sira < 1 || sira > PADOK_C_KUZU_ADET) throw new Error(`Sıra 1–${PADOK_C_KUZU_ADET}`);
  const t = oran(sira, PADOK_C_KUZU_ADET);
  const girisGunOnce = PADOK_C_TARTIM_DONEM_GUN; // 2 ay önce
  // Şu an 4,5 aylık (~135 gün); giriş 2 ay önce → girişte ~2,5 ay
  const yasGun = 135;
  const girisKg = Math.round((17 + t * 7) * 10) / 10; // giriş: 17–24 kg
  const artisKg = padokBeklenenArtisKg(girisKg, girisGunOnce);
  const weightKg = padokAgirlikGun(girisKg, girisGunOnce);
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

/** Dönem içi tartım noktaları: gün 0, 15, 30, 45, 60 — rasyon simülasyonu ile tutarlı artış */
export function padokCTartimSerisi(girisKg: number, _artisKg: number): {
  gunOnce: number;
  weightKg: number;
  adim: number;
  etiket: string;
}[] {
  const adimSayisi = PADOK_C_TARTIM_DONEM_GUN / PADOK_C_TARTIM_ARALIK_GUN; // 4 aralık → 5 nokta
  const seri: {
    gunOnce: number;
    weightKg: number;
    adim: number;
    etiket: string;
  }[] = [];
  for (let adim = 0; adim <= adimSayisi; adim++) {
    const gunGecen = adim * PADOK_C_TARTIM_ARALIK_GUN;
    const kg = padokAgirlikGun(girisKg, gunGecen);
    const etiket =
      adim === 0
        ? 'Giriş tartımı'
        : adim === adimSayisi
          ? 'Güncel tartım'
          : `Ara tartım · ${gunGecen}. gün`;
    seri.push({
      gunOnce: PADOK_C_TARTIM_DONEM_GUN - gunGecen,
      weightKg: kg,
      adim,
      etiket,
    });
  }
  return seri;
}

/**
 * Padok C: 20 kuzu · 4,5 aylık · giriş 2 ay önce · 15 günde bir tutarlı tartım.
 */
export async function seedPadokCGrupKuzular(): Promise<{ adet: number; padok: string }> {
  await ensureVarsayilanPadoklar();
  const now = new Date();
  const girisIso = isoOnce(now, PADOK_C_TARTIM_DONEM_GUN);
  const girisTarih = gunOnce(now, PADOK_C_TARTIM_DONEM_GUN);

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
        `Giriş ${girisTarih} (2 aydır bakılıyor) · 15 günde bir tartım · ` +
        `Giriş ${k.girisKg} kg → +${k.artisKg} kg → Şimdi ${k.weightKg} kg · ` +
        `Alım ${k.alimFiyat.toLocaleString('tr-TR')} ₺ · 4,5 aylık · ` +
        padokRasyonNotu(k.girisKg, 60),
    };
    await upsertAnimal(animal);

    const seri = padokCTartimSerisi(k.girisKg, k.artisKg);
    for (const nokta of seri) {
      const gunGecen = nokta.adim * PADOK_C_TARTIM_ARALIK_GUN;
      // 30. gün: eski `-ara-tartim` id’sini üzerine yaz (çift kayıt olmasın)
      const idSuffix =
        nokta.adim === 0
          ? 'giris-tartim'
          : nokta.adim === seri.length - 1
            ? 'guncel-tartim'
            : gunGecen === 30
              ? 'ara-tartim'
              : `tartim-gun-${gunGecen}`;
      await yazTartimEgerYok({
        id: `${k.id}-${idSuffix}`,
        animalId: k.id,
        weightKg: nokta.weightKg,
        recordedAt: isoOnce(now, nokta.gunOnce),
        notes:
          nokta.adim === 0
            ? `${nokta.etiket} · ${k.alimFiyat} ₺ · ${girisTarih}`
            : `${nokta.etiket} · ${nokta.weightKg} kg · +${Math.round((nokta.weightKg - k.girisKg) * 10) / 10} kg`,
      });
    }
  }

  return { adet: PADOK_C_KUZU_ADET, padok: ESLESIK_KUZU_PADOK_C };
}

/** Padok A + Gözlem + B + C + aşı/tartım/FCR — mevcut tartımları yeniden yazmaz */
export async function seedTumEslesikKuzular(): Promise<void> {
  await seedPadokAEslesikKuzular();
  await seedGozlemEslesikKuzular();
  await seedPadokBGrupKuzular();
  await seedPadokCGrupKuzular();
  await seedPadokHayvanKayitlari({ forcePlan: true });
}

/**
 * Mevcut kurulum: sadece eksik padok grubunu ekle / eksik tartım noktalarını merge et.
 * Her refresh'te hayvanları yeniden seed etmez; tartım tarihlerini bozmaz.
 * Simülasyon revizyonu: güncel tartım kg eski formülle yazılmışsa kg güncellenir (tarih korunur).
 */
async function padokGuncelTartimRevizeEt(
  kimlikFn: (sira: number) => { id: string; weightKg: number },
  seedFn: () => Promise<unknown>,
): Promise<void> {
  const k = kimlikFn(1);
  const wr = await getWeightRecords(k.id);
  const guncel = wr.find((r) => r.id === `${k.id}-guncel-tartim`);
  if (guncel && Math.abs(guncel.weightKg - k.weightKg) >= 0.05) {
    await seedFn();
  }
}

export async function ensurePadokKuzuVerisi(): Promise<void> {
  const animals = await getAnimals();
  const ids = new Set(animals.map((a) => a.id));
  const eksik = (prefix: string, adet: number) => {
    for (let i = 1; i <= adet; i++) {
      if (!ids.has(`${prefix}${String(i).padStart(2, '0')}`)) return true;
    }
    return false;
  };

  if (eksik('padok-a-kuzu-', PADOK_A_KUZU_ADET)) await seedPadokAEslesikKuzular();
  if (eksik('gozlem-kuzu-', GOZLEM_KUZU_ADET)) await seedGozlemEslesikKuzular();
  if (eksik('padok-b-grup-', PADOK_B_KUZU_ADET)) await seedPadokBGrupKuzular();
  else {
    await padokGuncelTartimRevizeEt(padokBGrupKimlik, seedPadokBGrupKuzular);
  }
  if (eksik('padok-c-grup-', PADOK_C_KUZU_ADET)) {
    await seedPadokCGrupKuzular();
  } else if (ids.has('padok-c-grup-01')) {
    const wr = await getWeightRecords('padok-c-grup-01');
    // Eski 2–3 noktalı seed → 15 günde bir 5 nokta tamamla (mevcut kayıtlar dokunulmaz)
    if (wr.length < 5) {
      await seedPadokCGrupKuzular();
    } else {
      await padokGuncelTartimRevizeEt(padokCGrupKimlik, seedPadokCGrupKuzular);
    }
  }

  // Aşı/ara tartım/rasyon: idempotent; mod planı yoksa oluştur (mevcut planı ezme)
  await seedPadokHayvanKayitlari();
}
