/**
 * Eski sürü aşı/ilaç kapanışı — her uygulama ayrı sağlık kaydı (bugün).
 * Yeniden çalıştırma: `eskiSuruAsiIlacKapat({ force: true })` veya seed `forcePlan`.
 *
 * Sonuç: Padok B/C (eski) tamamlandı; Gözlem + Padok A (~100) açık plan.
 */

import { ASI_PROGRAMI, asiDozEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  addHealthRecord,
  getAnimals,
  getHealthRecords,
} from '@/kaynak/cekirdek/veritabani';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import {
  ALBENDAZOL_PEKISTIRME_ID,
  HIZLI_BESI_GIRIS_ASI_PARAZIT,
  HIZLI_BESI_GIRIS_VITAMIN,
  HIZLI_BESI_PLAN_SURUM,
  HIZLI_BESI_TAKVIM,
  IVERMEKTIN_PEKISTIRME_ID,
  KARMA_RAPEL_PROGRAM_ID,
  rapelAnaProgramId,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import {
  TARTIM_15_PROGRAM_ID,
  TARTIM_GIRIS_PROGRAM_ID,
  planGuncelle,
  planlariOku,
  type HayvanKalemDurum,
  type ModTakviyePlani,
} from '@/kaynak/akilli-veteriner/mod-takviye';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  ESLESIK_KUZU_PADOK_B,
  ESLESIK_KUZU_PADOK_C,
} from '@/kaynak/cekirdek/padok-b-kuzular';
import { gozlemPadokMu } from '@/kaynak/suru/padok';
import { yemPlaniEskiSuruyuKapat, YEM_ESKI_KAPAT_SURUM } from '@/kaynak/gorevler/yem-gorev';

const META_KEY = 'sy_eski_suru_asi_kapat_v1';
/** Bu sürüm işlendiyse tekrar yazılmaz (force ile aşılır) */
export const ESKI_SURU_KAPAT_SURUM = `asi-ilac-${HIZLI_BESI_PLAN_SURUM}-2026-09-15`;

const PLAN_ID_PREFIX = 'mod1-hizli-besi-plan-';

export function eskiSuruPadokMu(paddock: string): boolean {
  return paddock === ESLESIK_KUZU_PADOK_B || paddock === ESLESIK_KUZU_PADOK_C;
}

export function acikPlanPadokMu(paddock: string): boolean {
  return gozlemPadokMu(paddock) || paddock === 'Padok A';
}

async function metaOku(): Promise<{ surum?: string }> {
  const raw = await kaliciGetItem(META_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as { surum?: string };
  } catch {
    return {};
  }
}

async function metaYaz(surum: string): Promise<void> {
  await kaliciSetItem(META_KEY, JSON.stringify({ surum, at: new Date().toISOString() }));
}

async function tekAsiKaydi(opts: {
  animal: Animal;
  programId: string;
  recordedAt: string;
}): Promise<boolean> {
  const anaId = rapelAnaProgramId(opts.programId) ?? opts.programId;
  const program = ASI_PROGRAMI.find((p) => p.id === anaId);
  if (!program) return false;
  const kayitId = `${opts.animal.id}-${opts.programId}-eski-kapat`;
  const mevcut = await getHealthRecords(opts.animal.id);
  if (mevcut.some((r) => r.id === kayitId)) return false;

  const mlEtiket = asiDozEtiketi(program);
  const medicine = `${program.koruma} (${program.ad})`;
  const kayitTipi = asiKategori(program) === 'parazit' ? 'treatment' : 'vaccine';
  await addHealthRecord({
    id: kayitId,
    animalId: opts.animal.id,
    recordType: kayitTipi,
    symptoms: '',
    diagnosis: program.koruma,
    treatment: `${program.ad} · ${mlEtiket}`,
    medicine,
    withdrawalDays: 0,
    vetName: 'Eski sürü kapanış',
    recordedAt: opts.recordedAt,
    notes: `${opts.animal.paddock} · Küpe ${opts.animal.earTag} · eski sürü — bugün tamamlandı (ayrı kayıt)`,
  });
  return true;
}

async function tekVitaminKaydi(opts: {
  animal: Animal;
  programId: string;
  recordedAt: string;
}): Promise<boolean> {
  const v = VITAMIN_PROGRAMI.find((x) => x.id === opts.programId);
  if (!v) return false;
  const kayitId = `${opts.animal.id}-${opts.programId}-eski-kapat`;
  const mevcut = await getHealthRecords(opts.animal.id);
  if (mevcut.some((r) => r.id === kayitId)) return false;
  await addHealthRecord({
    id: kayitId,
    animalId: opts.animal.id,
    recordType: 'treatment',
    symptoms: '',
    diagnosis: v.detay,
    treatment: `${v.ad} · ${vitaminDozEtiketi(v)}`,
    medicine: `${v.detay} (${v.ad})`,
    withdrawalDays: 0,
    vetName: 'Eski sürü kapanış',
    recordedAt: opts.recordedAt,
    notes: `${opts.animal.paddock} · Küpe ${opts.animal.earTag} · eski sürü vitamin — bugün`,
  });
  return true;
}

/**
 * Padok B/C (eski) kuzuların tüm aşı/parazit/vitamin plan kalemlerini
 * bugünün tarihiyle ayrı sağlık kaydı + plan yapıldı olarak kapatır.
 */
export async function eskiSuruAsiIlacKapat(opts?: {
  force?: boolean;
}): Promise<{
  hayvan: number;
  kayit: number;
  planGuncelleme: number;
  yem: number;
  atlandi: boolean;
}> {
  const meta = await metaOku();
  if (!opts?.force && meta.surum === ESKI_SURU_KAPAT_SURUM) {
    return { hayvan: 0, kayit: 0, planGuncelleme: 0, yem: 0, atlandi: true };
  }

  const now = new Date();
  const recordedAt = now.toISOString();
  const animals = (await getAnimals()).filter(
    (a) =>
      a.status !== 'sold' &&
      a.status !== 'dead' &&
      eskiSuruPadokMu(a.paddock),
  );

  let kayit = 0;
  for (const animal of animals) {
    for (const satir of HIZLI_BESI_TAKVIM) {
      if (satir.tip === 'tartim') continue;
      if (satir.tip === 'vitamin') {
        if (await tekVitaminKaydi({ animal, programId: satir.programId, recordedAt })) {
          kayit += 1;
        }
        continue;
      }
      if (await tekAsiKaydi({ animal, programId: satir.programId, recordedAt })) {
        kayit += 1;
      }
    }
  }

  const planlar = await planlariOku();
  let planGuncelleme = 0;
  const eskiIds = new Set(animals.map((a) => a.id));
  for (const plan of planlar) {
    if (plan.modId !== 'mod1' && !plan.id.startsWith(PLAN_ID_PREFIX)) continue;
    let degisti = false;
    const durumlar: HayvanKalemDurum[] = plan.durumlar.map((d) => {
      if (!eskiIds.has(d.animalId)) return d;
      if (d.yapildi && d.yapildiAt) return d;
      degisti = true;
      planGuncelleme += 1;
      const animal = animals.find((a) => a.id === d.animalId);
      return {
        ...d,
        earTag: d.earTag || (animal ? hayvanAnaEtiket(animal) : d.earTag),
        yapildi: true,
        yapildiAt: recordedAt,
      };
    });
    if (degisti) {
      const guncel: ModTakviyePlani = { ...plan, durumlar };
      await planGuncelle(guncel);
    }
  }

  const yem = await yemPlaniEskiSuruyuKapat([...eskiIds]);
  await metaYaz(ESKI_SURU_KAPAT_SURUM);

  return {
    hayvan: animals.length,
    kayit,
    planGuncelleme,
    yem,
    atlandi: false,
  };
}

/** Seed yardımcı — eski sürü giriş kalemleri listesi */
export function eskiSuruGirisProgramIds(): string[] {
  return [
    ...HIZLI_BESI_GIRIS_ASI_PARAZIT,
    ...HIZLI_BESI_GIRIS_VITAMIN,
    TARTIM_GIRIS_PROGRAM_ID,
    TARTIM_15_PROGRAM_ID,
    KARMA_RAPEL_PROGRAM_ID,
    IVERMEKTIN_PEKISTIRME_ID,
    ALBENDAZOL_PEKISTIRME_ID,
  ];
}

export { YEM_ESKI_KAPAT_SURUM };
