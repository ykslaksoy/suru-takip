import type { IlacDoz } from './teshis';

/** Türkçe ad (Tıbbi ad) formatı */
export function hastalikTamAd(adTr: string, tibbiAd: string): string {
  return `${adTr} (${tibbiAd})`;
}

function yuvarlaMg(deger: number): number {
  if (deger < 1) return Math.round(deger * 10) / 10;
  if (deger < 10) return Math.round(deger * 10) / 10;
  return Math.round(deger);
}

/** mg/kg veya sabit dozu kg'ye göre pratik metne çevirir */
export function hesaplaDozMetni(ilac: IlacDoz, kg: number): string {
  const parcalar: string[] = [];

  if (ilac.mlSabit != null) {
    parcalar.push(`${ilac.mlSabit} ml`);
  }
  if (ilac.mgPerKg != null) {
    parcalar.push(`${yuvarlaMg(ilac.mgPerKg * kg)} mg`);
  }
  if (ilac.iuPerKg != null) {
    parcalar.push(`${Math.round(ilac.iuPerKg * kg)} IU`);
  }

  if (parcalar.length > 0) {
    return `${parcalar.join(' + ')} uygulayın (${kg} kg hayvan)`;
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
  }));
}

export const PRAKTIK_KILO_SECENEKLERI = [8, 12, 15, 18, 22, 25, 28, 32, 35, 40, 45, 50];
