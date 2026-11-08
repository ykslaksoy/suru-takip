import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { adgHesapla } from '@/kaynak/kilo/adg';
import { tartimKayitlariSonOnce } from '@/kaynak/kilo/tartim-siralama';
import { calculateFCR } from '@/kaynak/kilo/fcr';
import {
  bireyselFcrGosterimMetni,
  type FcrYemGuven,
  type FcrYemKaynagiBilgi,
} from '@/kaynak/kilo/fcr-yem-kaynagi';
import { getAnimalRationPlan, dailyFeedForAnimal } from '@/kaynak/rasyon/hayvan-plani';
import { hayvanBasinaYemTuketimi } from '@/kaynak/stok/yem-tuketim';
import {
  ESLESIK_KUZU_PADOK_A,
  ESLESIK_KUZU_PADOK_B,
  ESLESIK_KUZU_PADOK_C,
} from '@/kaynak/cekirdek/padok-b-kuzular';
import { padokDonemOrtGunlukRasyon } from '@/kaynak/cekirdek/padok-rasyon';

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
  yemGuven: FcrYemGuven;
  yemAciklamasi: string;
  tahsis: boolean;
}

export type FcrSonuc =
  | { durum: 'hazir'; hesap: FcrHesap }
  | { durum: 'yok'; neden: string; kod?: string };

/** Tartım kayıtlarından dönem artışı ve gün sayısı (GCAA ile tutarlı). */
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

function yemKaynagiBilgi(
  opts: {
    stokKg: number | null;
    stokKaynak: 'stok_cikis' | 'sayim_farki' | null;
    planGunluk: number;
    padokSimule: boolean;
    donemGun: number;
  },
): FcrYemKaynagiBilgi | { guven: 'yok'; aciklama: string } {
  if (opts.stokKg != null && opts.stokKg > 0 && opts.stokKaynak) {
    return {
      guven: 'padok_tahsis',
      aciklama: `Dönemde padok yeminden başına ~${opts.stokKg} kg tahsis (${opts.stokKaynak}).`,
      tahsis: true,
    };
  }
  if (opts.planGunluk > 0) {
    if (opts.padokSimule) {
      return {
        guven: 'tahmini_rasyon',
        aciklama: `Padok besi programı ortalama rasyonu ~${opts.planGunluk} kg/gün × ${opts.donemGun} gün (tahmin).`,
        tahsis: false,
      };
    }
    return {
      guven: 'bireysel_plan',
      aciklama: `Kayıtlı günlük rasyon ${opts.planGunluk} kg/gün × ${opts.donemGun} gün.`,
      tahsis: false,
    };
  }
  return { guven: 'yok', aciklama: 'Karşılaştırılabilir bireysel yem kaydı yok' };
}

/**
 * Bireysel FCR — GCAA ölçülen tartımdan; yem bireysel plan veya açık padok tahsisi.
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
  let padokSimule = false;

  if (padokHayvanMi(animal) && dailyGivenKg <= 0) {
    dailyGivenKg = padokDonemOrtGunlukRasyon(donem.startWeightKg, donem.periodDays);
    padokSimule = true;
  } else if (dailyGivenKg <= 0) {
    dailyGivenKg = dailyFeedForAnimal(animal, donem.endWeightKg);
    padokSimule = false;
  }

  const rasyonToplamKg = Math.round(dailyGivenKg * donem.periodDays * 10) / 10;

  const stok = await hayvanBasinaYemTuketimi(animal, donem.startAt, donem.endAt);
  const stokToplamKg = stok?.kg ?? null;

  const yemBilgi = yemKaynagiBilgi({
    stokKg: stokToplamKg,
    stokKaynak: stok?.kaynak ?? null,
    planGunluk: dailyGivenKg,
    padokSimule,
    donemGun: donem.periodDays,
  });

  if (yemBilgi.guven === 'yok') {
    return {
      durum: 'yok',
      neden: `${yemBilgi.aciklama}. Yemden yararlanma oranı (FCR) gösterilmez.`,
      kod: 'yem_yok',
    };
  }

  let totalFeedKg: number;
  let kaynak: FcrKaynak;

  if (stokToplamKg != null && stokToplamKg > 0 && stok) {
    totalFeedKg = stokToplamKg;
    kaynak = stok.kaynak;
  } else {
    totalFeedKg = rasyonToplamKg;
    kaynak = 'gunluk_rasyon';
  }

  if (totalFeedKg <= 0) {
    return {
      durum: 'yok',
      neden: 'Yem miktarı sıfır — FCR hesaplanamaz',
      kod: 'yetersiz_girdi',
    };
  }

  const fcr = calculateFCR(totalFeedKg, donem.gainKg);
  if (fcr == null) {
    return {
      durum: 'yok',
      neden: 'Yem veya kilo artışı yetersiz — Yemden yararlanma oranı (FCR) hesaplanamaz',
      kod: 'yetersiz_girdi',
    };
  }

  const tamBilgi: FcrYemKaynagiBilgi =
    yemBilgi.guven === 'yok'
      ? { guven: 'yok', aciklama: yemBilgi.aciklama, tahsis: false }
      : yemBilgi;

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
      yemGuven: tamBilgi.guven,
      yemAciklamasi: bireyselFcrGosterimMetni(tamBilgi),
      tahsis: tamBilgi.tahsis,
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
