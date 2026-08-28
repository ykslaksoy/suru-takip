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

function urunMlTahmini(mgEtken: number, mgMl: number): string {
  const ml = mgEtken / mgMl;
  const yuvarla = ml < 10 ? Math.round(ml * 10) / 10 : Math.round(ml);
  return `≈ ${yuvarla} ml şişeden (${mgMl} mg/ml — vet onayıyla)`;
}

/** mg/kg veya sabit dozu kg'ye göre pratik metne çevirir */
export function hesaplaDozMetni(ilac: IlacDoz, kg: number): string {
  const parcalar: string[] = [];
  let mgToplam: number | null = null;

  if (ilac.mlSabit != null) {
    parcalar.push(`${ilac.mlSabit} ml`);
  }
  if (ilac.mgPerKg != null) {
    mgToplam = yuvarlaMg(ilac.mgPerKg * kg);
    parcalar.push(`${mgToplam} mg etken madde`);
  }
  if (ilac.iuPerKg != null) {
    parcalar.push(`${Math.round(ilac.iuPerKg * kg)} IU`);
  }

  if (parcalar.length > 0) {
    const hesap =
      ilac.mgPerKg != null && mgToplam != null
        ? `Hesap: ${kg} kg × ${ilac.mgPerKg} mg/kg = ${mgToplam} mg`
        : null;
    const ana = `${parcalar.join(' + ')} uygulayın`;
    const satirlar = [ana];
    if (hesap) satirlar.push(hesap);
    if (mgToplam != null && ilac.urunMgMl != null && ilac.tip === 'igne') {
      satirlar.push(urunMlTahmini(mgToplam, ilac.urunMgMl));
    }
    if (ilac.mgPerKg != null && kg > 18) {
      satirlar.push(
        `Kuzu ise kiloyu kontrol edin — 12 kg → ${yuvarlaMg(ilac.mgPerKg * 12)} mg · 15 kg → ${yuvarlaMg(ilac.mgPerKg * 15)} mg`
      );
    }
    return satirlar.join('\n');
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

export const PRAKTIK_KILO_SECENEKLERI = [8, 10, 12, 15, 18, 22, 25, 28, 32, 35, 40];
