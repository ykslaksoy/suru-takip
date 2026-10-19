/**
 * Rasyonu olmayan parti/padok için öneri — saf hesap.
 * calculateRation (kaynak/rasyon/hesapla) günlük yem/baş verir; bu miktar kaba / kesif yem payına bölünüp
 * yem stoğundaki yemlere kg/baş/gün olarak dağıtılır. Stokta karşılığı olmayan yem "eksik" işaretlenir.
 */
import { calculateRation, type RationPhase } from '@/kaynak/rasyon/hesapla';
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import type { PartiRasyonu } from './hesap';

export type YemSinifi = 'kaba' | 'kesif';

const KABA = ['ot', 'yonca', 'saman', 'silaj', 'fiğ', 'fig', 'korunga', 'mera', 'kaba', 'samanı', 'sap'];

export function yemSinifi(ad: string): YemSinifi {
  const s = ad.toLocaleLowerCase('tr');
  const kelimeler = s.split(/[^a-zçğıöşü0-9]+/u).filter(Boolean);
  return kelimeler.some((k) => KABA.includes(k)) || /silaj|yonca|saman|korunga/.test(s) ? 'kaba' : 'kesif';
}

/** Kaba yem payı (kalanı kesif) */
export function kabaPayi(faz: RationPhase): number {
  return faz === 'lamb_fattening' ? 0.4 : 0.6;
}

export const VARSAYILAN_FAZ: RationPhase = 'lamb_fattening';
/** Tartımı olmayan padok için varsayılan ortalama canlı ağırlık */
export const VARSAYILAN_KG = 30;

export const EKSIK_YEM_ADI: Record<YemSinifi, string> = { kaba: 'Kuru ot', kesif: 'Kesif yem' };

export type OneriKalemi = { stockId: string | null; ad: string; sinif: YemSinifi; kgBasGun: number; eksik: boolean };

export type RasyonOnerisi = {
  parti: string;
  bas: number;
  ortKg: number;
  tartimli: boolean;
  faz: RationPhase;
  gunlukKgBas: number;
  toplamGunlukKg: number;
  kalemler: OneriKalemi[];
  eksikVar: boolean;
};

const yuv = (n: number) => Math.round(n * 100) / 100;

export function rasyonOnerisi(g: {
  parti: string;
  bas: number;
  ortKg: number | null;
  faz?: RationPhase;
  yemler: Pick<StockItem, 'id' | 'name'>[];
}): RasyonOnerisi {
  const faz = g.faz ?? VARSAYILAN_FAZ;
  const tartimli = g.ortKg != null && g.ortKg > 0;
  const ortKg = tartimli ? (g.ortKg as number) : VARSAYILAN_KG;
  const r = calculateRation({ liveWeightKg: ortKg, count: g.bas, phase: faz, forageQuality: 'medium' });
  const pay: Record<YemSinifi, number> = { kaba: kabaPayi(faz), kesif: 1 - kabaPayi(faz) };
  const kalemler: OneriKalemi[] = [];
  for (const sinif of ['kesif', 'kaba'] as YemSinifi[]) {
    const uygun = g.yemler.filter((y) => yemSinifi(y.name) === sinif);
    const pk = r.dailyFeedKg * pay[sinif];
    if (!uygun.length) {
      kalemler.push({ stockId: null, ad: EKSIK_YEM_ADI[sinif], sinif, kgBasGun: yuv(pk), eksik: true });
      continue;
    }
    for (const y of uygun) kalemler.push({ stockId: y.id, ad: y.name, sinif, kgBasGun: yuv(pk / uygun.length), eksik: false });
  }
  const gunlukKgBas = yuv(kalemler.reduce((s, k) => s + k.kgBasGun, 0));
  return {
    parti: g.parti,
    bas: g.bas,
    ortKg: Math.round(ortKg * 10) / 10,
    tartimli,
    faz,
    gunlukKgBas,
    toplamGunlukKg: Math.round(gunlukKgBas * g.bas * 10) / 10,
    kalemler,
    eksikVar: kalemler.some((k) => k.eksik),
  };
}

/** Kuzusu olup aktif rasyonu olmayan partiler (alfabetik) */
export function rasyonsuzPartiler(basSayisi: Record<string, number>, rasyonlar: Pick<PartiRasyonu, 'parti' | 'aktif'>[]): string[] {
  const aktif = new Set(rasyonlar.filter((r) => r.aktif).map((r) => r.parti));
  return Object.keys(basSayisi)
    .filter((p) => (basSayisi[p] ?? 0) > 0 && !aktif.has(p))
    .sort((a, b) => a.localeCompare(b, 'tr'));
}

/** Parti başına son tartımların ortalaması (tartımı olmayan hayvanlar sayılmaz) */
export function partiOrtalamaKg(hayvanlar: { paddock: string; sonKg: number | null }[]): Record<string, number | null> {
  const t: Record<string, { s: number; n: number }> = {};
  for (const h of hayvanlar) {
    const p = h.paddock?.trim();
    if (!p) continue;
    t[p] ??= { s: 0, n: 0 };
    if (h.sonKg != null && h.sonKg > 0) {
      t[p].s += h.sonKg;
      t[p].n += 1;
    }
  }
  const out: Record<string, number | null> = {};
  for (const [p, v] of Object.entries(t)) out[p] = v.n ? v.s / v.n : null;
  return out;
}
