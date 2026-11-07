import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

/** Eski → yeni (grafik ve GCA için) */
export function tartimKayitlariKronolojik(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort((a, b) => {
    const da = new Date(a.recordedAt).getTime();
    const db = new Date(b.recordedAt).getTime();
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

/** Yeni → eski (liste ekranları) */
export function tartimKayitlariSonOnce(records: WeightRecord[]): WeightRecord[] {
  return [...tartimKayitlariKronolojik(records)].reverse();
}

export function tartimTarihNormalize(kaynak: string | Date = new Date()): string {
  const d = typeof kaynak === 'string' ? new Date(kaynak) : kaynak;
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function tartimKgDogrula(kg: number): { ok: true; kg: number } | { ok: false; neden: string } {
  if (!Number.isFinite(kg) || kg <= 0) return { ok: false, neden: 'Geçerli pozitif kilo gerekir' };
  return { ok: true, kg: Math.round(kg * 1000) / 1000 };
}

export function tartimYinelenenMi(
  mevcut: WeightRecord[],
  next: { animalId: string; weightKg: number; recordedAt: string },
  pencereMs: number,
): WeightRecord | null {
  if (pencereMs <= 0) return null;
  const t = new Date(next.recordedAt).getTime();
  for (const m of mevcut) {
    if (
      m.animalId === next.animalId &&
      m.weightKg === next.weightKg &&
      Math.abs(new Date(m.recordedAt).getTime() - t) <= pencereMs
    ) {
      return m;
    }
  }
  return null;
}
