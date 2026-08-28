import {
  calculateADG,
  getAnimals,
  getLatestWeight,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcr } from '@/kaynak/kilo/fcr-hesap';
import { akilliRasyonOnerisi } from '@/kaynak/rasyon/akilli-oneri';
import { rasyonKarsilastirma } from '@/kaynak/rasyon/karsilastirma';
import { adgDeger, fcrDeger } from '@/sabitler/Metinler';

export type Mod1MetrikRapor = {
  hayvanSayisi: number;
  ortalamaAdg: number | null;
  ortalamaFcr: number | null;
  tahminiGunlukMaliyet: number | null;
  gercekGunlukYemKg: number | null;
  oneriGunlukYemKg: number | null;
  karsilastirmaOzet: string;
  notlar: string[];
};

/** Mod 1 besi dönemi — ADG · FCR · maliyet · öneri vs gerçek özeti. */
export async function hesaplaMod1MetrikRapor(): Promise<Mod1MetrikRapor | null> {
  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  if (animals.length === 0) return null;

  const oneri = await akilliRasyonOnerisi();
  const kars = await rasyonKarsilastirma();

  const adgler: number[] = [];
  const fcrs: number[] = [];
  let toplamYem = 0;
  let yemSay = 0;

  for (const a of animals) {
    const adg = await calculateADG(a.id);
    if (adg != null) adgler.push(adg);
    const records = await getWeightRecords(a.id);
    const fcr = await hesaplaFcr(a, records);
    if (fcr?.dailyGivenKg != null && fcr.dailyGivenKg > 0) {
      toplamYem += fcr.dailyGivenKg;
      yemSay += 1;
    }
    if (fcr?.fcr != null) fcrs.push(fcr.fcr);
  }

  const ortalamaAdg = adgler.length
    ? Math.round(adgler.reduce((s, v) => s + v, 0) / adgler.length)
    : null;
  const ortalamaFcr = fcrs.length
    ? Math.round((fcrs.reduce((s, v) => s + v, 0) / fcrs.length) * 100) / 100
    : null;
  const gercekGunlukYemKg = yemSay ? Math.round((toplamYem / yemSay) * 100) / 100 : null;

  const notlar: string[] = [];
  if (ortalamaAdg != null) notlar.push(`Sürü ort. ${adgDeger(ortalamaAdg)} (30 gün)`);
  else notlar.push('ADG için en az iki tartım gerekli.');
  if (ortalamaFcr != null) notlar.push(`Sürü ort. ${fcrDeger(ortalamaFcr)}`);
  else notlar.push('FCR için tartım + yem kaydı gerekli.');
  if (oneri?.tahminiGunlukMaliyet != null) {
    notlar.push(`Tahmini günlük maliyet ≈ ${oneri.tahminiGunlukMaliyet} ₺`);
  }

  return {
    hayvanSayisi: animals.length,
    ortalamaAdg,
    ortalamaFcr,
    tahminiGunlukMaliyet: oneri?.tahminiGunlukMaliyet ?? null,
    gercekGunlukYemKg,
    oneriGunlukYemKg: oneri?.hesap.dailyFeedKg ?? null,
    karsilastirmaOzet: kars?.ozet ?? 'Karşılaştırma için yeterli veri yok.',
    notlar,
  };
}
