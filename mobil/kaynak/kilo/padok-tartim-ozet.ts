import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getLatestWeight, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { adgGramGunuOrNull } from '@/kaynak/kilo/adg';

export type PadokTartimOzet = {
  /** Şu an padok üyesi (sürü listesi) */
  uyelerSayisi: number;
  tartilanSayisi: number;
  /** Yalnız tartılmış kuzuların son kilo ortalaması — tartımsızlar dahil değil */
  ortKg: number | null;
  /** Ölçülen GCA ortalaması (yalnız tartılı + 2 tartımı olanlar) */
  ortAdgGram: number | null;
  kapsamMetni: string;
};

function ortalama(sayilar: (number | null)[]): number | null {
  const v = sayilar.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((s, n) => s + n, 0) / v.length;
}

/**
 * Padok özeti: güncel üyelik listesi; kilo/GCA yalnız ölçülen hayvanlardan.
 * Üye değişimi biyolojik artış gibi gösterilmez.
 */
export async function padokTartimOzeti(uyeler: Animal[]): Promise<PadokTartimOzet> {
  const kilolar: (number | null)[] = [];
  const adgler: (number | null)[] = [];
  for (const a of uyeler) {
    const kg = await getLatestWeight(a.id).catch(() => null);
    if (kg != null) kilolar.push(kg);
    const records = await getWeightRecords(a.id).catch(() => []);
    const adg = records.length >= 2 ? adgGramGunuOrNull(records) : null;
    if (adg != null) adgler.push(adg);
  }
  const tartilanSayisi = kilolar.length;
  const ortKg = ortalama(kilolar);
  const ortAdg = ortalama(adgler);
  const kapsamMetni =
    tartilanSayisi === 0
      ? 'Henüz tartılmış kuzu yok (özet tahmin değil)'
      : `Ölçülen kuzular: ${tartilanSayisi}/${uyeler.length} · ort. kg yalnız tartılılardan`;

  return {
    uyelerSayisi: uyeler.length,
    tartilanSayisi,
    ortKg: ortKg == null ? null : Math.round(ortKg * 10) / 10,
    ortAdgGram: ortAdg == null ? null : Math.round(ortAdg),
    kapsamMetni,
  };
}
