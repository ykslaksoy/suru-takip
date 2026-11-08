import {
  calculateADG,
  getAnimals,
  getLatestWeight,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcrSonuc } from '@/kaynak/kilo/fcr-hesap';
import { suruFcrBirlestir } from '@/kaynak/kilo/padok-performans-analitik';
import { akilliRasyonOnerisi } from '@/kaynak/rasyon/akilli-oneri';
import { rasyonKarsilastirma } from '@/kaynak/rasyon/karsilastirma';
import { adgDeger, fcrDeger, metrikYetersizVeri } from '@/sabitler/Metinler';

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
  const fcrParcalar: { toplamYemKg: number; artisKg: number }[] = [];
  let toplamYem = 0;
  let yemSay = 0;

  for (const a of animals) {
    const adg = await calculateADG(a.id);
    if (adg != null) adgler.push(adg);
    const records = await getWeightRecords(a.id);
    const fcrSonuc = await hesaplaFcrSonuc(a, records);
    if (fcrSonuc.durum === 'hazir') {
      const fcr = fcrSonuc.hesap;
      fcrParcalar.push({ toplamYemKg: fcr.totalFeedKg, artisKg: fcr.gainKg });
      if (fcr.dailyGivenKg > 0) {
        toplamYem += fcr.dailyGivenKg;
        yemSay += 1;
      }
    }
  }

  const ortalamaAdg = adgler.length
    ? Math.round(adgler.reduce((s, v) => s + v, 0) / adgler.length)
    : null;
  const birlestir = suruFcrBirlestir(fcrParcalar);
  const ortalamaFcr = birlestir.fcr;
  const gercekGunlukYemKg = yemSay ? Math.round((toplamYem / yemSay) * 100) / 100 : null;

  const notlar: string[] = [];
  if (ortalamaAdg != null) notlar.push(`Sürü ort. ${adgDeger(ortalamaAdg)} (30 gün)`);
  else notlar.push(metrikYetersizVeri('GCAA'));
  if (ortalamaFcr != null) {
    notlar.push(
      `Sürü FCR (toplam yem/toplam artış): ${fcrDeger(ortalamaFcr)} · ${birlestir.olculenSayisi}/${animals.length} hayvan`,
    );
  } else notlar.push(metrikYetersizVeri('FCR'));
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
