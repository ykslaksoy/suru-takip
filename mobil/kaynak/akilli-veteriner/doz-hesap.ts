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

/** Parantez içi küçük formül — kg → ml */
export function hesaplaDozFormul(ilac: IlacDoz, kg: number): string | null {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') return null;

  const ml = hesaplaToplamMl(ilac, kg);
  if (ml == null) return null;

  if (ilac.tip === 'asi' || (ilac.mlSabit != null && ilac.mgPerKg == null && ilac.iuPerKg == null)) {
    return `(kg değişse de ${ml} ml)`;
  }

  return `(${kg} kg → ${ml} ml)`;
}

/** Kg onayına göre çobanın anlayacağı ml doz metni */
export function hesaplaDozMetni(ilac: IlacDoz, kg: number): string {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') {
    if (ilac.mgPerKg == null && ilac.iuPerKg == null) return ilac.doz;
  }

  const ml = hesaplaToplamMl(ilac, kg);

  if (ml != null) {
    return `Şırıngaya ${ml} ml çek`;
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
    dozFormul: hesaplaDozFormul(il, kg) ?? undefined,
  }));
}

export const PRAKTIK_KILO_SECENEKLERI = [8, 10, 12, 15, 18, 22, 25, 28, 32, 35, 40];
