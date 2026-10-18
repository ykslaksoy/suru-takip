/**
 * Hızlı tartım hesapları — saf mantık.
 * Referans büyüme eğrisi: VARSAYILAN değerdir (bilimsel kaynak iddiası yok), Ayarlar'dan değiştirilebilir.
 * Eğri: ilk tartım kilosundan itibaren günde `referansAdgGram` artış; gerçek kilo bunun
 * `toleransYuzde` altına düşerse "eğrinin altında" işaretlenir.
 */
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

export type TartimAyar = {
  hedefKg: number;
  referansAdgGram: number;
  toleransYuzde: number;
};

export const VARSAYILAN_TARTIM_AYAR: TartimAyar = { hedefKg: 45, referansAdgGram: 250, toleransYuzde: 10 };

const GUN = 86400000;

/** İki tartım arası günlük artış (gram/gün); 1 günden kısa aralıkta null */
export function gunlukArtisGram(onceki: { kg: number; at: string }, yeni: { kg: number; at: string }): number | null {
  const gun = (new Date(yeni.at).getTime() - new Date(onceki.at).getTime()) / GUN;
  if (!Number.isFinite(gun) || gun < 1) return null;
  return Math.round(((yeni.kg - onceki.kg) * 1000) / gun);
}

/** Hedef kiloya kalan tahmini gün; artış yoksa/negatifse null; hedefe ulaştıysa 0 */
export function hedefeKalanGun(kg: number, adgGram: number | null, hedefKg: number): number | null {
  if (kg >= hedefKg) return 0;
  if (adgGram == null || adgGram <= 0) return null;
  return Math.ceil(((hedefKg - kg) * 1000) / adgGram);
}

function sirala(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/** Tarihteki beklenen kilo (referans eğri); ilk tartım yoksa null */
export function referansKg(records: WeightRecord[], at: string, ayar: TartimAyar): number | null {
  const s = sirala(records);
  if (!s.length) return null;
  const ilk = s[0];
  const gun = Math.max(0, (new Date(at).getTime() - new Date(ilk.recordedAt).getTime()) / GUN);
  return Math.round((ilk.weightKg + (gun * ayar.referansAdgGram) / 1000) * 10) / 10;
}

export function egriAltindaMi(kg: number, beklenen: number | null, ayar: TartimAyar): boolean {
  if (beklenen == null) return false;
  return kg < beklenen * (1 - ayar.toleransYuzde / 100);
}

export type TartimAnaliz = {
  kg: number;
  oncekiKg: number | null;
  farkKg: number | null;
  adgGram: number | null;
  hedefeGun: number | null;
  beklenenKg: number | null;
  egriAltinda: boolean;
};

/** Yeni tartım (henüz kaydedilmemiş olabilir) için anlık analiz — önceki kayıtlarla karşılaştırır */
export function tartimAnaliz(oncekiKayitlar: WeightRecord[], yeni: { kg: number; at: string }, ayar: TartimAyar): TartimAnaliz {
  const s = sirala(oncekiKayitlar).filter((r) => r.recordedAt <= yeni.at);
  const son = s[s.length - 1] ?? null;
  // Günlük artış: aynı gün içindeki son kayıt yerine en az 1 gün önceki son tartım
  const yeniT = new Date(yeni.at).getTime();
  const kiyas = [...s].reverse().find((r) => yeniT - new Date(r.recordedAt).getTime() >= GUN) ?? null;
  const adg = kiyas ? gunlukArtisGram({ kg: kiyas.weightKg, at: kiyas.recordedAt }, yeni) : null;
  const beklenen = s.length ? referansKg(s, yeni.at, ayar) : null;
  return {
    kg: yeni.kg,
    oncekiKg: son?.weightKg ?? null,
    farkKg: son ? Math.round((yeni.kg - son.weightKg) * 10) / 10 : null,
    adgGram: adg,
    hedefeGun: hedefeKalanGun(yeni.kg, adg, ayar.hedefKg),
    beklenenKg: beklenen,
    egriAltinda: egriAltindaMi(yeni.kg, beklenen, ayar),
  };
}

/** Kısa Türkçe özet: "+240 g/gün · hedefe ~54 gün · eğrinin altında" */
export function analizOzeti(a: TartimAnaliz, ayar: TartimAyar): string {
  const p: string[] = [];
  if (a.adgGram != null) p.push(`${a.adgGram >= 0 ? '+' : ''}${a.adgGram} g/gün`);
  else if (a.oncekiKg == null) p.push('ilk tartım');
  else p.push('günlük artış için önceki tartım en az 1 gün önce olmalı');
  if (a.hedefeGun === 0) p.push(`${ayar.hedefKg} kg hedefe ulaştı`);
  else if (a.hedefeGun != null) p.push(`${ayar.hedefKg} kg için ~${a.hedefeGun} gün`);
  if (a.egriAltinda) p.push('⚠ eğrinin altında');
  return p.join(' · ');
}
