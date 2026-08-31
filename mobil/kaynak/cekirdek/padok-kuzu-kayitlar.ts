/**
 * Padok A/B/C kuzuları — tartım, aşı, rasyon, mod plan seed.
 * A: aşı yapılacak · B/C: girişte aşı+parazit yapılmış.
 */

import { v4 as uuidv4 } from 'uuid';
import { ASI_PROGRAMI, asiDozEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  addHealthRecord,
  addWeightRecord,
  getAnimals,
  getHealthRecords,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import {
  ASI_PLAN_GUN,
  gunSonraTarih,
  modTakviyeSablonu,
  planGuncelle,
  planKaydet,
  planlariOku,
  TARTIM_15_PROGRAM_ID,
  type HayvanKalemDurum,
  type ModTakviyePlani,
} from '@/kaynak/akilli-veteriner/mod-takviye';
import {
  HIZLI_BESI_GIRIS_ASI_PARAZIT,
  HIZLI_BESI_GIRIS_VITAMIN,
  HIZLI_BESI_PLAN_BASLIK,
  HIZLI_BESI_PLAN_SURUM,
  ENTEROTOKSEMI_RAPEL_PROGRAM_ID,
  hizliBesiPlanGun,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import {
  ESLESIK_KUZU_PADOK_A,
  ESLESIK_KUZU_PADOK_B,
  ESLESIK_KUZU_PADOK_C,
} from './padok-b-kuzular';
import { hayvanAnaEtiket } from './hayvan-etiket';

const PLAN_ID = `mod1-hizli-besi-plan-${HIZLI_BESI_PLAN_SURUM}`;

function isoOnce(now: Date, gun: number): string {
  return new Date(now.getTime() - gun * 86400000).toISOString();
}

function girisGunOnce(animal: Animal, now: Date): number {
  if (animal.createdAt) {
    return Math.max(
      0,
      Math.round((now.getTime() - new Date(animal.createdAt).getTime()) / 86400000),
    );
  }
  return 0;
}

function planTarihFromGiris(animal: Animal, gun: number, now: Date): string {
  const g = girisGunOnce(animal, now);
  const hedef = Math.max(0, gun - g);
  return gunSonraTarih(hedef, now);
}

async function asiKaydiYaz(opts: {
  animalId: string;
  earTag: string;
  programId: string;
  recordedAt: string;
  padok: string;
}): Promise<void> {
  const kayitId = `${opts.animalId}-${opts.programId}-seed`;
  const mevcut = await getHealthRecords(opts.animalId);
  if (mevcut.some((r) => r.id === kayitId)) return;

  const program = ASI_PROGRAMI.find((p) => p.id === opts.programId);
  if (!program) return;
  const mlEtiket = asiDozEtiketi(program);
  const medicine = `${program.koruma} (${program.ad})`;
  const kayitTipi = asiKategori(program) === 'parazit' ? 'treatment' : 'vaccine';
  await addHealthRecord({
    id: kayitId,
    animalId: opts.animalId,
    recordType: kayitTipi,
    symptoms: '',
    diagnosis: program.koruma,
    treatment: `${program.ad} · ${mlEtiket}`,
    medicine,
    withdrawalDays: 0,
    vetName: 'Giriş aşı programı',
    recordedAt: opts.recordedAt,
    notes: `${opts.padok} · Küpe ${opts.earTag} · giriş`,
  });
}

/** Padok B/C: girişte mod1 aşı+parazit kayıtları */
export async function seedPadokGirisAsilari(): Promise<{ yazilan: number; padok: string[] }> {
  const animals = await getAnimals();
  const hedef = animals.filter(
    (a) =>
      a.paddock === ESLESIK_KUZU_PADOK_B ||
      a.paddock === ESLESIK_KUZU_PADOK_C,
  );
  const now = new Date();
  let yazilan = 0;
  for (const a of hedef) {
    const gun = a.paddock === ESLESIK_KUZU_PADOK_B ? 30 : 60;
    const tarih = isoOnce(now, gun);
    for (const programId of HIZLI_BESI_GIRIS_ASI_PARAZIT) {
      await asiKaydiYaz({
        animalId: a.id,
        earTag: a.earTag,
        programId,
        recordedAt: tarih,
        padok: a.paddock,
      });
      yazilan += 1;
    }
  }
  return {
    yazilan,
    padok: [ESLESIK_KUZU_PADOK_B, ESLESIK_KUZU_PADOK_C],
  };
}

/**
 * Padok B ara tartım (15. gün) — C’nin 15 günde bir serisi ana seed’de yazılıyor.
 */
export async function seedPadokAraTartimlari(): Promise<number> {
  const animals = await getAnimals();
  const now = new Date();
  let n = 0;
  for (const a of animals) {
    if (a.paddock !== ESLESIK_KUZU_PADOK_B) continue;
    const records = await getWeightRecords(a.id);
    if (records.some((r) => r.id === `${a.id}-ara-tartim`)) continue;
    const sorted = [...records].sort(
      (x, y) => new Date(x.recordedAt).getTime() - new Date(y.recordedAt).getTime(),
    );
    if (sorted.length < 2) continue;
    const giris = sorted[0];
    const guncel = sorted[sorted.length - 1];
    const araKg = Math.round(((giris.weightKg + guncel.weightKg) / 2) * 10) / 10;
    await addWeightRecord({
      id: `${a.id}-ara-tartim`,
      animalId: a.id,
      weightKg: araKg,
      recordedAt: isoOnce(now, 15),
      notes: `Ara tartım · 15. gün · ${a.paddock}`,
    });
    n += 1;
  }
  return n;
}

/** Son tartıma göre rasyon planı — hazır+arpa+yonca+saman karışımı */
export async function seedPadokRasyonPlanlari(): Promise<number> {
  const {
    seedPadokKuzuRasyonTarifi,
    seedPadokRasyonStoklari,
    seedPadokHayvanRasyonPlanlari,
  } = await import('./padok-rasyon');
  await seedPadokKuzuRasyonTarifi();
  await seedPadokRasyonStoklari();
  return seedPadokHayvanRasyonPlanlari();
}

/** Mod1 hızlı besi: A planlı · B/C giriş aşı+hap+vitamin yapıldı · tartım 15g */
export async function seedMod1PadokTakviyePlani(): Promise<ModTakviyePlani> {
  const modId = 'mod1' as const;
  const kalemler = modTakviyeSablonu(modId);
  const hayvanlar = (await getAnimals()).filter(
    (a) =>
      a.modId === modId &&
      a.status !== 'sold' &&
      a.status !== 'dead' &&
      (a.paddock === ESLESIK_KUZU_PADOK_A ||
        a.paddock === ESLESIK_KUZU_PADOK_B ||
        a.paddock === ESLESIK_KUZU_PADOK_C),
  );

  const now = new Date();
  const girisB = isoOnce(now, 30);
  const girisC = isoOnce(now, 60);
  const asi21 = gunSonraTarih(ASI_PLAN_GUN, now);

  const durumlar: HayvanKalemDurum[] = [];
  const oncekiMap = new Map<string, HayvanKalemDurum>(
    ((await planlariOku()).find((p) => p.id === PLAN_ID)?.durumlar ?? []).map(
      (d) => [`${d.animalId}|${d.tip}:${d.programId}`, d],
    ),
  );

  for (const h of hayvanlar) {
    const girisYapildi =
      h.paddock === ESLESIK_KUZU_PADOK_B || h.paddock === ESLESIK_KUZU_PADOK_C;
    const yapildiAt =
      h.paddock === ESLESIK_KUZU_PADOK_B ? girisB : h.paddock === ESLESIK_KUZU_PADOK_C ? girisC : undefined;
    const padokA = h.paddock === ESLESIK_KUZU_PADOK_A;

    const wr = await getWeightRecords(h.id);
    const tartimYapildi = wr.length >= 2;
    const sonTartim = [...wr].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )[0]?.recordedAt;

    for (const k of kalemler) {
      const key = `${h.id}|${k.tip}:${k.programId}`;
      const onceki = oncekiMap.get(key);
      const asiParazit = k.tip === 'asi' || k.tip === 'parazit';
      const asiParazitYapildi =
        girisYapildi &&
        asiParazit &&
        k.programId !== ENTEROTOKSEMI_RAPEL_PROGRAM_ID &&
        (HIZLI_BESI_GIRIS_ASI_PARAZIT as readonly string[]).includes(k.programId);
      const vitaminYapildi =
        girisYapildi &&
        k.tip === 'vitamin' &&
        (HIZLI_BESI_GIRIS_VITAMIN as readonly string[]).includes(k.programId);
      const tartimKalemi =
        k.tip === 'tartim' && k.programId === TARTIM_15_PROGRAM_ID && tartimYapildi;

      const yapildi =
        onceki?.yapildi || asiParazitYapildi || vitaminYapildi || tartimKalemi;

      let planlananAt = onceki?.planlananAt;
      if (!yapildi) {
        const gun = hizliBesiPlanGun(k.tip, k.programId);
        if (padokA) {
          planlananAt = onceki?.planlananAt ?? gunSonraTarih(gun, now);
        } else if (girisYapildi) {
          planlananAt = onceki?.planlananAt ?? planTarihFromGiris(h, gun, now);
        }
      }

      durumlar.push({
        animalId: h.id,
        earTag: hayvanAnaEtiket(h),
        tip: k.tip,
        programId: k.programId,
        yapildi,
        yapildiAt:
          onceki?.yapildiAt ??
          (asiParazitYapildi || vitaminYapildi
            ? yapildiAt
            : tartimKalemi
              ? sonTartim
              : undefined),
        planlananAt: yapildi ? onceki?.planlananAt : planlananAt,
      });
    }
  }

  const plan: ModTakviyePlani = {
    id: PLAN_ID,
    modId,
    baslik: HIZLI_BESI_PLAN_BASLIK,
    tarih: asi21,
    kalemler,
    hayvanIds: hayvanlar.map((h) => h.id),
    durumlar,
    olusturuldu: now.toISOString(),
  };

  const mevcut = (await planlariOku()).find((p) => p.id === PLAN_ID);
  if (mevcut) await planGuncelle(plan);
  else await planKaydet(plan);

  const { planSil } = await import('@/kaynak/akilli-veteriner/mod-takviye');
  for (const e of await planlariOku()) {
    if (e.modId === 'mod1' && e.id !== PLAN_ID) await planSil(e.id);
  }

  return plan;
}

/** Padok A/B/C tam seed sonrası kayıtlar */
export async function seedPadokHayvanKayitlari(opts?: {
  /** true: mod planı yoksa oluştur / zorla yenile */
  forcePlan?: boolean;
}): Promise<void> {
  await seedPadokGirisAsilari();
  await seedPadokAraTartimlari();
  await seedPadokRasyonPlanlari();
  const mevcut = (await planlariOku()).find((p) => p.id === PLAN_ID);
  const tartimEksik = !mevcut?.kalemler.some(
    (k) => k.tip === 'tartim' && k.programId === TARTIM_15_PROGRAM_ID,
  );
  const sablon = modTakviyeSablonu('mod1');
  const sablonEksik =
    !mevcut ||
    mevcut.kalemler.length !== sablon.length ||
    !sablon.every((k) =>
      mevcut.kalemler.some((m) => m.tip === k.tip && m.programId === k.programId),
    );
  const asi21Eksik =
    !!mevcut &&
    !mevcut.durumlar.some(
      (d) =>
        (d.tip === 'asi' || d.tip === 'parazit' || d.tip === 'vitamin') &&
        !d.yapildi &&
        !!d.planlananAt,
    );
  if (!mevcut || opts?.forcePlan || tartimEksik || sablonEksik || asi21Eksik) {
    await seedMod1PadokTakviyePlani();
  }
}
