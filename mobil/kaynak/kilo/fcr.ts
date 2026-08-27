import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

/** Son N günde kilo artışı (kg) — en az iki tartım gerekir. */
export function weightGainKg(records: WeightRecord[], days = 30): number | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  const latest = sorted[0];
  const cutoff = new Date(latest.recordedAt);
  cutoff.setDate(cutoff.getDate() - days);
  const older = sorted.find((r) => new Date(r.recordedAt) <= cutoff) ?? sorted[sorted.length - 1];
  if (older.id === latest.id) return null;
  const gain = latest.weightKg - older.weightKg;
  if (gain <= 0) return null;
  return Math.round(gain * 100) / 100;
}

/** FCR = verilen yem (kg) / alınan canlı ağırlık artışı (kg) */
export function calculateFCR(feedKg: number, gainKg: number): number | null {
  if (feedKg <= 0 || gainKg <= 0) return null;
  return Math.round((feedKg / gainKg) * 100) / 100;
}
