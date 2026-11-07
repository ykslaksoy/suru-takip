import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { adgHesapla } from '@/kaynak/kilo/adg';
import { tartimKayitlariSonOnce } from '@/kaynak/kilo/tartim-siralama';
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

export type FcrSonuc =
  | { durum: 'hazir'; hesap: FcrHesap }
  | { durum: 'yok'; neden: string; kod?: string };

/** Tartım kayıtlarından dönem artışı ve gün sayısı (GCA ile tutarlı). */
export function tartimDonemi(records: WeightRecord[], maxDays = 30): TartimDonemi | null {
  const adg = adgHesapla(records, maxDays);
  if (adg.durum !== 'hazir') return null;
  const sorted = tartimKayitlariSonOnce(records);
  const latest = sorted[0];
  const cutoff = new Date(latest.recordedAt);
  cutoff.setDate(cutoff.getDate() - maxDays);
  const older = sorted.find((r) => new Date(r.recordedAt) <= cutoff) ?? sorted[sorted.length - 1];
  return {
    gainKg: adg.gainKg,
    periodDays: Math.ceil(adg.periodDays),
    startWeightKg: older.weightKg,
    endWeightKg: latest.weightKg,
    startAt: adg.startAt,
    endAt: adg.endAt,
  };
}

/**
 * FCR otomatik:
 * - Tartım → kilo artışı ve dönem günü
 * - Günlük verilen rasyon → plan × gün (yedek)
 * - Stok çıkışı / sayım farkı → gerçek tüketim (öncelikli)
 */
export async function hesaplaFcrSonuc(
  animal: Animal,
  records: WeightRecord[],
  maxDays = 30,
): Promise<FcrSonuc> {
  const adg = adgHesapla(records, maxDays);
  const donem = tartimDonemi(records, maxDays);
  if (!donem || adg.durum !== 'hazir') {
    return {
      durum: 'yok',
      neden: adg.durum === 'yok' ? adg.neden : 'Dönem hesaplanamadı',
      kod: adg.durum === 'yok' ? adg.kod : undefined,
    };
  }

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
  if (fcr == null) {
    return {
      durum: 'yok',
      neden: 'Yem veya kilo artışı yetersiz — Yemden yararlanma oranı (FCR) hesaplanamaz',
      kod: 'yetersiz_girdi',
    };
  }

  return {
    durum: 'hazir',
    hesap: {
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
    },
  };
}

export async function hesaplaFcr(
  animal: Animal,
  records: WeightRecord[],
  maxDays = 30,
): Promise<FcrHesap | null> {
  const sonuc = await hesaplaFcrSonuc(animal, records, maxDays);
  return sonuc.durum === 'hazir' ? sonuc.hesap : null;
}
