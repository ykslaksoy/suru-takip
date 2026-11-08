import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getLatestWeight, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { padokPerformansOzeti } from '@/kaynak/kilo/padok-performans-ozet';

export type PadokTartimOzet = {
  uyelerSayisi: number;
  tartilanSayisi: number;
  ortKg: number | null;
  ortAdgGram: number | null;
  olculenGcaaSayisi: number;
  uygunGcaaSayisi: number;
  padokFcr: number | null;
  padokFcrUyari: string | null;
  gcaaOzetEtiketi: string;
  kapsamMetni: string;
};

function ortalama(sayilar: (number | null)[]): number | null {
  const v = sayilar.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((s, n) => s + n, 0) / v.length;
}

/**
 * Padok özeti: güncel üyelik; kilo yalnız tartılılardan; GCAA/FCR padok analitiği.
 */
export async function padokTartimOzeti(uyeler: Animal[]): Promise<PadokTartimOzet> {
  const kilolar: (number | null)[] = [];
  for (const a of uyeler) {
    const kg = await getLatestWeight(a.id).catch(() => null);
    if (kg != null) kilolar.push(kg);
    await getWeightRecords(a.id).catch(() => []);
  }
  const tartilanSayisi = kilolar.length;
  const ortKg = ortalama(kilolar);
  const padokAd = uyeler[0]?.paddock?.trim() ?? '';
  const perf = await padokPerformansOzeti(uyeler, padokAd);

  const kiloEk =
    tartilanSayisi === 0
      ? 'Henüz tartılmış kuzu yok'
      : `Ölçülen kuzular: ${tartilanSayisi}/${uyeler.length} · ort. kg yalnız tartılılardan`;

  return {
    uyelerSayisi: uyeler.length,
    tartilanSayisi,
    ortKg: ortKg == null ? null : Math.round(ortKg * 10) / 10,
    ortAdgGram: perf.ortGcaaGram,
    olculenGcaaSayisi: perf.olculenGcaaSayisi,
    uygunGcaaSayisi: perf.uygunGcaaSayisi,
    padokFcr: perf.padokFcr,
    padokFcrUyari: perf.padokFcrUyari,
    gcaaOzetEtiketi: perf.gcaaOzetEtiketi,
    kapsamMetni: `${kiloEk} · ${perf.kapsamMetni}`,
  };
}
