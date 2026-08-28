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

/** Ekranda Türkçe ondalık — 1,6 ml */
export function formatMlTr(deger: number): string {
  return String(deger).replace('.', ',');
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

/** Kilo aralığına göre kuzu / koyun */
export function hayvanTipiEtiket(kg: number): string {
  return kg <= 18 ? 'Kuzu' : 'Koyun';
}

function mlDozCumlesi(tip: IlacDoz['tip'], ml: number): string {
  const metin = formatMlTr(ml);
  if (tip === 'oral') return `${metin} ml ver`;
  if (tip === 'topikal') return `${metin} ml uygula`;
  return `Şırıngaya ${metin} ml çek`;
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

  return dozdanMlOku(ilac.doz);
}

/** Kiloya bağlı kısımdan kg başına ml */
function hesaplaKgBasinaMl(ilac: IlacDoz, kg: number): number | null {
  if (kg <= 0) return null;

  let degiskenMl = 0;
  if (ilac.mgPerKg != null && ilac.urunMgMl != null) {
    degiskenMl += (kg * ilac.mgPerKg) / ilac.urunMgMl;
  }
  if (ilac.iuPerKg != null && ilac.urunIuMl != null) {
    degiskenMl += (kg * ilac.iuPerKg) / ilac.urunIuMl;
  }

  if (degiskenMl <= 0) return null;
  return yuvarlaMl(degiskenMl / kg);
}

/** Parantez içi — hayvan, kilo, kg başına ml */
export function hesaplaDozFormul(ilac: IlacDoz, kg: number): string | null {
  if (ilac.tip === 'oral' || ilac.tip === 'topikal') return null;
  if (kg <= 0) return null;

  const ml = hesaplaToplamMl(ilac, kg);
  if (ml == null) return null;

  const tip = hayvanTipiEtiket(kg);
  const kgBasina = hesaplaKgBasinaMl(ilac, kg);
  const sabit = ilac.mlSabit != null && (ilac.mgPerKg != null || ilac.iuPerKg != null) ? ilac.mlSabit : null;

  if (kgBasina != null && sabit != null) {
    return `(${tip} ${kg} kg · kg başına ${formatMlTr(kgBasina)} ml + ${formatMlTr(sabit)} ml sabit)`;
  }
  if (kgBasina != null) {
    return `(${tip} ${kg} kg · kg başına ${formatMlTr(kgBasina)} ml)`;
  }
  return `(${tip} ${kg} kg · sabit ${formatMlTr(ml)} ml)`;
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
