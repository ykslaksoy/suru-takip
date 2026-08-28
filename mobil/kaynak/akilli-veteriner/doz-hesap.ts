import type { IlacDoz } from './teshis';

/** Türkçe ad (Tıbbi ad) formatı */
export function hastalikTamAd(adTr: string, tibbiAd: string): string {
  return `${adTr} (${tibbiAd})`;
}

function yuvarlaMl(deger: number): number {
  if (deger < 1) return Math.round(deger * 100) / 100;
  if (deger < 10) return Math.round(deger * 10) / 10;
  return Math.round(deger);
}

/** kg + protokolden şırıngaya çekilecek toplam ml */
export function hesaplaToplamMl(ilac: IlacDoz, kg: number): number | null {
  if (ilac.tip === 'asi' && ilac.mlSabit != null) return ilac.mlSabit;

  let ml = 0;
  let hesaplandi = false;

  if (ilac.mgPerKg != null && ilac.urunMgMl != null) {
    ml += (kg * ilac.mgPerKg) / ilac.urunMgMl;
    hesaplandi = true;
  }
  if (ilac.iuPerKg != null && ilac.urunIuMl != null) {
    ml += (kg * ilac.iuPerKg) / ilac.urunIuMl;
    hesaplandi = true;
  }
  if (ilac.mlSabit != null) {
    ml += ilac.mlSabit;
    hesaplandi = true;
  }

  if (!hesaplandi) return null;
  return yuvarlaMl(ml);
}

function karsilastirmaKilolari(kg: number): number[] {
  const aday = [8, 12, 15, 18, 22, 25, 30, kg];
  return [...new Set(aday.filter((k) => k > 0 && k < 200))].sort((a, b) => a - b);
}

/** Kg'ye göre ml karşılaştırma — çoban bilgi notu */
export function hesaplaDozBilgiNotu(ilac: IlacDoz, kg: number): string | null {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') return null;

  if (ilac.tip === 'asi' || (ilac.mlSabit != null && ilac.mgPerKg == null && ilac.iuPerKg == null)) {
    const ml = ilac.mlSabit ?? hesaplaToplamMl(ilac, kg);
    if (ml == null) return null;
    return `Bilgi: Kilo değişmez — hayvan başı ${ml} ml (12 kg de ${ml} ml, 24 kg de ${ml} ml)`;
  }

  if (ilac.mgPerKg == null && ilac.iuPerKg == null) return null;

  const ornekler = karsilastirmaKilolari(kg)
    .map((k) => {
      const ml = hesaplaToplamMl(ilac, k);
      if (ml == null) return null;
      const vurgu = k === kg ? ' ← bu hayvan' : '';
      return `${k} kg → ${ml} ml${vurgu}`;
    })
    .filter((s): s is string => s != null);

  if (ornekler.length === 0) return null;
  return `Bilgi: Kilo arttıkça ml artar — ${ornekler.join(' · ')}`;
}

/** Kg onayına göre çobanın anlayacağı ml doz metni */
export function hesaplaDozMetni(ilac: IlacDoz, kg: number): string {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') {
    if (ilac.mgPerKg == null && ilac.iuPerKg == null) return ilac.doz;
  }

  const ml = hesaplaToplamMl(ilac, kg);

  if (ml != null) {
    const satirlar = [`Şırıngaya ${ml} ml çek (${kg} kg hayvan)`];
    if (ilac.tip === 'asi') {
      satirlar[0] = `${ml} ml / hayvan — şırıngaya ${ml} ml çek`;
    }
    return satirlar.join('\n');
  }

  if (ilac.mgPerKg != null || ilac.iuPerKg != null) {
    return `Veteriner şişe dozunu onaylasın (${kg} kg hayvan)`;
  }

  if (/mg\/kg|IU\/kg/i.test(ilac.doz)) {
    return `Veteriner dozu hesaplasın (${kg} kg hayvan)`;
  }

  return ilac.doz;
}

/** Onaylanmış kilo ile tüm ilaç dozlarını hesapla */
export function ilaclariKgIleHesapla(ilaclar: IlacDoz[], kg: number): IlacDoz[] {
  return ilaclar.map((il) => ({
    ...il,
    doz: hesaplaDozMetni(il, kg),
    bilgiNotu: hesaplaDozBilgiNotu(il, kg) ?? undefined,
  }));
}

export const PRAKTIK_KILO_SECENEKLERI = [8, 10, 12, 15, 18, 22, 25, 28, 32, 35, 40];
