import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { calculateFCR } from '@/kaynak/kilo/fcr';
import { getAnimalRationPlan, dailyFeedForAnimal } from '@/kaynak/rasyon/hayvan-plani';
import { hayvanBasinaYemTuketimi } from '@/kaynak/stok/yem-tuketim';
import {
  ESLESIK_KUZU_PADOK_A,
  ESLESIK_KUZU_PADOK_B,
  ESLESIK_KUZU_PADOK_C,
} from '@/kaynak/cekirdek/padok-b-kuzular';
import { padokDonemOrtGunlukRasyon, padokGunlukRasyonKg } from '@/kaynak/cekirdek/padok-rasyon';

const PADOKLAR = new Set([ESLESIK_KUZU_PADOK_A, ESLESIK_KUZU_PADOK_B, ESLESIK_KUZU_PADOK_C]);

function padokHayvanMi(animal: Animal): boolean {
  return PADOKLAR.has(animal.paddock?.trim() ?? '');
}

export interface TartimDonemi {
  gainKg: number;
  periodDays: number;
  startWeightKg: number;
  endWeightKg: number;
  startAt: string;
  endAt: string;
}

export type FcrKaynak = 'gunluk_rasyon' | 'stok_cikis' | 'sayim_farki';

export interface FcrHesap {
  fcr: number;
  gainKg: number;
  periodDays: number;
  dailyGivenKg: number;
  totalFeedKg: number;
  startWeightKg: number;
  endWeightKg: number;
  kaynak: FcrKaynak;
  rasyonToplamKg: number;
  stokToplamKg: number | null;
}

/** Tartım kayıtlarından dönem artışı ve gün sayısı. */
export function tartimDonemi(records: WeightRecord[], maxDays = 30): TartimDonemi | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  const latest = sorted[0];
  const cutoff = new Date(latest.recordedAt);
  cutoff.setDate(cutoff.getDate() - maxDays);
  const older = sorted.find((r) => new Date(r.recordedAt) <= cutoff) ?? sorted[sorted.length - 1];
  if (older.id === latest.id) return null;

  const periodDays = Math.ceil(
    (new Date(latest.recordedAt).getTime() - new Date(older.recordedAt).getTime()) / 86400000
  );
  if (periodDays <= 0) return null;

  const gainKg = latest.weightKg - older.weightKg;
  if (gainKg <= 0) return null;

  return {
    gainKg: Math.round(gainKg * 100) / 100,
    periodDays,
    startWeightKg: older.weightKg,
    endWeightKg: latest.weightKg,
    startAt: older.recordedAt,
    endAt: latest.recordedAt,
  };
}

/**
 * FCR otomatik:
 * - Tartım → kilo artışı ve dönem günü
 * - Günlük verilen rasyon → plan × gün (yedek)
 * - Stok çıkışı / sayım farkı → gerçek tüketim (öncelikli)
 */
export async function hesaplaFcr(
  animal: Animal,
  records: WeightRecord[],
  maxDays = 30
): Promise<FcrHesap | null> {
  const donem = tartimDonemi(records, maxDays);
  if (!donem) return null;

  const plan = await getAnimalRationPlan(animal.id);
  let dailyGivenKg = plan?.dailyGivenKg ?? plan?.dailyFeedKg ?? 0;

  if (padokHayvanMi(animal)) {
    // Güncel plan tek gün rasyonu; dönem FCR için simülasyon ortalaması (ADG ile tutarlı).
    dailyGivenKg = padokDonemOrtGunlukRasyon(donem.startWeightKg, donem.periodDays);
  } else if (dailyGivenKg <= 0) {
    dailyGivenKg = dailyFeedForAnimal(animal, donem.endWeightKg);
  }

  const rasyonToplamKg = Math.round(dailyGivenKg * donem.periodDays * 10) / 10;

  const stok = await hayvanBasinaYemTuketimi(animal, donem.startAt, donem.endAt);
  const stokToplamKg = stok?.kg ?? null;

  let totalFeedKg: number;
  let kaynak: FcrKaynak;

  if (stokToplamKg != null && stokToplamKg > 0 && stok) {
    totalFeedKg = stokToplamKg;
    kaynak = stok.kaynak;
  } else {
    totalFeedKg = rasyonToplamKg;
    kaynak = 'gunluk_rasyon';
  }

  const fcr = calculateFCR(totalFeedKg, donem.gainKg);
  if (fcr == null) return null;

  return {
    fcr,
    gainKg: donem.gainKg,
    periodDays: donem.periodDays,
    dailyGivenKg,
    totalFeedKg,
    startWeightKg: donem.startWeightKg,
    endWeightKg: donem.endWeightKg,
    kaynak,
    rasyonToplamKg,
    stokToplamKg,
  };
}
