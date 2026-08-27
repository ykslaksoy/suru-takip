import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { dailyFeedForAnimal } from '@/kaynak/rasyon/hayvan-plani';
import { calculateFCR } from '@/kaynak/kilo/fcr';

export interface TartimDonemi {
  gainKg: number;
  periodDays: number;
  startWeightKg: number;
  endWeightKg: number;
  startAt: string;
  endAt: string;
}

export interface FcrHesap {
  fcr: number;
  gainKg: number;
  periodDays: number;
  dailyFeedKg: number;
  totalFeedKg: number;
  startWeightKg: number;
  endWeightKg: number;
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
 * FCR = dönem yem tüketimi / kilo artışı.
 * Günlük yem: dönem başı + sonu tartımına göre rasyon ortalaması × gün sayısı.
 */
export function hesaplaFcr(
  animal: Animal,
  records: WeightRecord[],
  maxDays = 30
): FcrHesap | null {
  const donem = tartimDonemi(records, maxDays);
  if (!donem) return null;

  const feedStart = dailyFeedForAnimal(animal, donem.startWeightKg);
  const feedEnd = dailyFeedForAnimal(animal, donem.endWeightKg);
  const dailyFeedKg = Math.round(((feedStart + feedEnd) / 2) * 100) / 100;
  const totalFeedKg = Math.round(dailyFeedKg * donem.periodDays * 10) / 10;
  const fcr = calculateFCR(totalFeedKg, donem.gainKg);
  if (fcr == null) return null;

  return {
    fcr,
    gainKg: donem.gainKg,
    periodDays: donem.periodDays,
    dailyFeedKg,
    totalFeedKg,
    startWeightKg: donem.startWeightKg,
    endWeightKg: donem.endWeightKg,
  };
}
