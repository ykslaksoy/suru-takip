import { calculateADG, getAnimals, getLatestWeight, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { hesaplaFcr } from '@/kaynak/kilo/fcr-hesap';
import { akilliRasyonOnerisi } from '@/kaynak/rasyon/akilli-oneri';
import { dailyFeedForAnimal, getAnimalRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { adgDeger, fcrDeger } from '@/sabitler/Metinler';

export type KarsilastirmaDurum = 'iyi' | 'kotu' | 'notr';

export type KarsilastirmaSatiri = {
  metrik: string;
  oneri: string;
  gercek: string;
  fark: string;
  durum: KarsilastirmaDurum;
};

export type RasyonKarsilastirma = {
  satirlar: KarsilastirmaSatiri[];
  ozet: string;
};

function satir(
  metrik: string,
  oneriNum: number | null,
  gercekNum: number | null,
  birim: string,
  dusukIyi: boolean
): KarsilastirmaSatiri {
  const oneri = oneriNum != null ? `${oneriNum.toLocaleString('tr-TR')} ${birim}` : '—';
  const gercek = gercekNum != null ? `${gercekNum.toLocaleString('tr-TR')} ${birim}` : '—';
  let fark = '—';
  let durum: KarsilastirmaDurum = 'notr';
  if (oneriNum != null && gercekNum != null) {
    const delta = Math.round((gercekNum - oneriNum) * 100) / 100;
    fark = `${delta >= 0 ? '+' : ''}${delta.toLocaleString('tr-TR')} ${birim}`;
    const iyi = dusukIyi ? delta <= 0 : delta >= 0;
    durum = Math.abs(delta) < 0.05 ? 'notr' : iyi ? 'iyi' : 'kotu';
  }
  return { metrik, oneri, gercek, fark, durum };
}

/** Planlanan akıllı öneri ↔ sürüde gerçekleşen ortalamalar. */
export async function rasyonKarsilastirma(): Promise<RasyonKarsilastirma | null> {
  const oneri = await akilliRasyonOnerisi();
  if (!oneri) return null;

  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  if (animals.length === 0) return null;

  const adgler: number[] = [];
  const fcrs: number[] = [];
  let toplamVerilen = 0;
  let verilenSay = 0;

  for (const a of animals) {
    const adg = await calculateADG(a.id);
    if (adg != null) adgler.push(adg);
    const records = await getWeightRecords(a.id);
    const fcr = await hesaplaFcr(a, records);
    if (fcr?.fcr != null) fcrs.push(fcr.fcr);
    const w = await getLatestWeight(a.id);
    const plan = await getAnimalRationPlan(a.id);
    const given = plan?.dailyGivenKg ?? (w != null ? dailyFeedForAnimal(a, w) : 0);
    if (given > 0) {
      toplamVerilen += given;
      verilenSay += 1;
    }
  }

  const ortAdg = adgler.length ? Math.round(adgler.reduce((s, v) => s + v, 0) / adgler.length) : null;
  const ortFcr = fcrs.length
    ? Math.round((fcrs.reduce((s, v) => s + v, 0) / fcrs.length) * 100) / 100
    : null;
  const gercekYem = verilenSay ? Math.round((toplamVerilen / verilenSay) * 100) / 100 : null;
  const oneriYem = oneri.hesap.dailyFeedKg;
  const hedefAdg = 180;

  const satirlar: KarsilastirmaSatiri[] = [
    satir('Günlük yem / hayvan', oneriYem, gercekYem, 'kg', true),
    satir('Ort. ADG (30 gün)', hedefAdg, ortAdg, 'g/gün', false),
    satir('Ort. FCR', 6.5, ortFcr, '', true),
  ];

  if (oneri.tahminiGunlukMaliyet != null && gercekYem != null && oneriYem > 0) {
    const birimMaliyet = oneri.tahminiGunlukMaliyet / oneriYem;
    const gercekMaliyet = Math.round(birimMaliyet * gercekYem * animals.length * 100) / 100;
    satirlar.push(
      satir(
        'Tahmini günlük maliyet (sürü)',
        oneri.tahminiGunlukMaliyet,
        gercekMaliyet,
        '₺',
        true
      )
    );
  }

  const iyi = satirlar.filter((s) => s.durum === 'iyi').length;
  const kotu = satirlar.filter((s) => s.durum === 'kotu').length;
  let ozet =
    kotu === 0
      ? `${iyi} metrik hedefte — öneri ile uyumlu.`
      : `${kotu} metrik sapma var — rasyon veya tartımı gözden geçirin.`;
  if (ortAdg != null) ozet += ` Ort. ${adgDeger(ortAdg)}`;
  if (ortFcr != null) ozet += ` · ${fcrDeger(ortFcr)}`;

  return { satirlar, ozet };
}
