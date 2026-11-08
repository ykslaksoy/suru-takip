/**
 * GCAA (günlük canlı ağırlık artışı, g/gün) — ölçülen tartımlardan; tahmin değil.
 */
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { tartimKayitlariSonOnce } from '@/kaynak/kilo/tartim-siralama';

export type AdgKod =
  | 'tek_tartim'
  | 'ayni_an'
  | 'kayip'
  | 'sifir_artis'
  | 'gecersiz_tarih';

export type AdgSonuc =
  | {
      durum: 'hazir';
      gramGun: number;
      gainKg: number;
      periodDays: number;
      startAt: string;
      endAt: string;
      startWeightKg: number;
      endWeightKg: number;
    }
  | { durum: 'yok'; neden: string; kod: AdgKod };

const MS_GUN = 86_400_000;

export function adgHesapla(records: WeightRecord[], maxDays = 30): AdgSonuc {
  const sorted = tartimKayitlariSonOnce(records);
  if (sorted.length < 2) {
    return { durum: 'yok', neden: 'En az iki tartım gerekir', kod: 'tek_tartim' };
  }
  const latest = sorted[0];
  const cutoff = new Date(latest.recordedAt);
  cutoff.setDate(cutoff.getDate() - maxDays);
  const older = sorted.find((r) => new Date(r.recordedAt) <= cutoff) ?? sorted[sorted.length - 1];
  if (older.id === latest.id) {
    return { durum: 'yok', neden: 'Karşılaştırma için daha eski tartım yok', kod: 'tek_tartim' };
  }

  const t0 = new Date(older.recordedAt).getTime();
  const t1 = new Date(latest.recordedAt).getTime();
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 < t0) {
    return { durum: 'yok', neden: 'Tartım tarihleri tutarsız', kod: 'gecersiz_tarih' };
  }

  const periodDays = (t1 - t0) / MS_GUN;
  if (periodDays <= 0) {
    return { durum: 'yok', neden: 'İki tartım aynı anda — günlük artış hesaplanamaz', kod: 'ayni_an' };
  }

  const gainKg = latest.weightKg - older.weightKg;
  if (gainKg < 0) {
    return { durum: 'yok', neden: 'Kilo kaybı — canlı ağırlık artışı raporlanmaz', kod: 'kayip' };
  }
  if (gainKg === 0) {
    return { durum: 'yok', neden: 'Dönemde artış yok', kod: 'sifir_artis' };
  }

  const gramGun = Math.round((gainKg / periodDays) * 1000);
  return {
    durum: 'hazir',
    gramGun,
    gainKg: Math.round(gainKg * 100) / 100,
    periodDays: Math.round(periodDays * 100) / 100,
    startAt: older.recordedAt,
    endAt: latest.recordedAt,
    startWeightKg: older.weightKg,
    endWeightKg: latest.weightKg,
  };
}

export function adgGramGunuOrNull(records: WeightRecord[], maxDays = 30): number | null {
  const s = adgHesapla(records, maxDays);
  return s.durum === 'hazir' ? s.gramGun : null;
}

export function adgAciklamaMetni(sonuc: AdgSonuc): string {
  if (sonuc.durum === 'hazir') {
    return `${sonuc.gramGun} g/gün (${sonuc.periodDays.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} gün, +${sonuc.gainKg} kg)`;
  }
  return sonuc.neden;
}
