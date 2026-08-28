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

/** Metinden ml değerlerini topla — "500 ml + 5 ml" → 505 */
export function dozdanMlOku(doz: string): number | null {
  const parcalar = doz.match(/(\d+(?:[.,]\d+)?)\s*ml/gi);
  if (!parcalar?.length) return null;
  const toplam = parcalar.reduce((acc, p) => {
    const n = parseFloat(p.replace(/ml/i, '').trim().replace(',', '.'));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
  return toplam > 0 ? yuvarlaMl(toplam) : null;
}

function mlDozCumlesi(tip: IlacDoz['tip'], ml: number): string {
  if (tip === 'oral') return `${ml} ml ver`;
  if (tip === 'topikal') return `${ml} ml uygula`;
  return `Şırıngaya ${ml} ml çek`;
}

/** kg + protokolden toplam ml */
export function hesaplaToplamMl(ilac: IlacDoz, kg: number): number | null {
  let ml = 0;
  let hesaplandi = false;

  if (ilac.mgPerKg != null && ilac.urunMgMl != null && kg > 0) {
    ml += (kg * ilac.mgPerKg) / ilac.urunMgMl;
    hesaplandi = true;
  }
  if (ilac.iuPerKg != null && ilac.urunIuMl != null && kg > 0) {
    ml += (kg * ilac.iuPerKg) / ilac.urunIuMl;
    hesaplandi = true;
  }
  if (ilac.mlSabit != null) {
    ml += ilac.mlSabit;
    hesaplandi = true;
  }

  if (hesaplandi) return yuvarlaMl(ml);

  const okunan = dozdanMlOku(ilac.doz);
  return okunan;
}

/** Parantez içi küçük formül — kg → ml (yalnızca kilo etkileyen dozlar) */
export function hesaplaDozFormul(ilac: IlacDoz, kg: number): string | null {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') return null;
  if (ilac.mgPerKg == null && ilac.iuPerKg == null) {
    const ml = hesaplaToplamMl(ilac, kg);
    if (ml == null) return null;
    return `(kg değişse de ${ml} ml)`;
  }

  const ml = hesaplaToplamMl(ilac, kg);
  if (ml == null || kg <= 0) return null;
  return `(${kg} kg → ${ml} ml)`;
}

/** Her zaman ml — çoban dili */
export function hesaplaDozMetni(ilac: IlacDoz, kg: number): string {
  const kiloGerekli = ilac.mgPerKg != null || ilac.iuPerKg != null;
  if (kiloGerekli && kg <= 0) {
    return 'Kilo onaylayın — ml hesabı için';
  }

  const ml = hesaplaToplamMl(ilac, kg);
  if (ml != null) return mlDozCumlesi(ilac.tip, ml);

  if (kiloGerekli) {
    return 'Veteriner onayı — ml dozu için';
  }

  return ilac.doz.trim() ? ilac.doz : 'Veteriner onayı — ml dozu için';
}

/** Onaylanmış kilo ile tüm ilaç dozlarını ml olarak hesapla */
export function ilaclariKgIleHesapla(ilaclar: IlacDoz[], kg: number): IlacDoz[] {
  return ilaclar.map((il) => ({
    ...il,
    doz: hesaplaDozMetni(il, kg),
    dozFormul: hesaplaDozFormul(il, kg) ?? undefined,
  }));
}

export const PRAKTIK_KILO_SECENEKLERI = [8, 10, 12, 15, 18, 22, 25, 28, 32, 35, 40];
