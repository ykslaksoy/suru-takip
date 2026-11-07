import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { adgHesapla, type AdgSonuc } from '@/kaynak/kilo/adg';
import {
  padokFcrBirlestir,
  padokGcaaOzetHesapla,
  padokToplamArtisKg,
  type PadokGcaaSatir,
} from '@/kaynak/kilo/padok-performans-analitik';
import { padokToplamYemTuketimi } from '@/kaynak/stok/yem-tuketim';
import { padokGcaaOzetEtiketi } from '@/kaynak/kilo/performans-metrik-etiket';
import { fcrDegerMetni } from '@/kaynak/kilo/performans-metrik-etiket';

const MAX_GUN = 30;

export type PadokPerformansOzet = {
  uyelerSayisi: number;
  ortGcaaGram: number | null;
  olculenGcaaSayisi: number;
  uygunGcaaSayisi: number;
  padokFcr: number | null;
  padokFcrUyari: string | null;
  donemGun: number | null;
  donemBaslangic: string | null;
  donemBitis: string | null;
  toplamYemKg: number | null;
  toplamArtisKg: number | null;
  kapsamMetni: string;
  gcaaOzetEtiketi: string;
};

export async function padokPerformansOzeti(
  uyeler: Animal[],
  padokAd: string,
): Promise<PadokPerformansOzet> {
  const satirlar: { animalId: string; adg: AdgSonuc; maxDays: number }[] = [];
  const gcaaSatirlar: PadokGcaaSatir[] = [];

  for (const a of uyeler) {
    const records: WeightRecord[] = await getWeightRecords(a.id).catch(() => []);
    const adg: AdgSonuc = adgHesapla(records, MAX_GUN);
    satirlar.push({ animalId: a.id, adg, maxDays: MAX_GUN });
    if (adg.durum === 'hazir') {
      gcaaSatirlar.push({
        animalId: a.id,
        gcaaGram: adg.gramGun,
        donem: {
          gainKg: adg.gainKg,
          periodDays: Math.ceil(adg.periodDays),
          startWeightKg: adg.startWeightKg,
          endWeightKg: adg.endWeightKg,
          startAt: adg.startAt,
          endAt: adg.endAt,
        },
      });
    }
  }

  const gcaa = padokGcaaOzetHesapla(satirlar);
  const toplamArtis = padokToplamArtisKg(gcaaSatirlar);

  let toplamYemKg: number | null = null;
  let padokFcr: number | null = null;
  let padokFcrUyari: string | null = null;

  if (gcaa.donemBaslangic && gcaa.donemBitis && gcaaSatirlar.length > 0) {
    const padokYem = await padokToplamYemTuketimi(padokAd, gcaa.donemBaslangic, gcaa.donemBitis);
    toplamYemKg = padokYem?.kg ?? null;
    if (toplamYemKg != null) {
      const birlestir = padokFcrBirlestir({
        toplamYemKg,
        toplamArtisKg: toplamArtis,
        olculenArtisHayvan: gcaaSatirlar.length,
        padokBasSayisi: uyeler.length,
        donemGun: gcaa.donemGun,
      });
      padokFcr = birlestir.fcr;
      padokFcrUyari = birlestir.uyari;
      if (padokYem && padokFcr != null) {
        padokFcrUyari = [padokFcrUyari, `Yem kaynağı: ${padokYem.kaynak}`].filter(Boolean).join(' ');
      }
    } else {
      padokFcrUyari = 'Padok düzeyi yem kaydı yok — padok FCR gösterilmez (bireysel oran ortalaması kullanılmaz).';
    }
  }

  const fcrEk =
    padokFcr != null
      ? ` · Padok FCR (toplam): ${fcrDegerMetni(padokFcr)}`
      : ' · Padok FCR: —';

  const gcaaEk =
    gcaa.ortGcaaGram != null
      ? ` · ${padokGcaaOzetEtiketi()}: ${gcaa.ortGcaaGram} g/gün`
      : ` · ${padokGcaaOzetEtiketi()}: —`;

  return {
    uyelerSayisi: uyeler.length,
    ortGcaaGram: gcaa.ortGcaaGram,
    olculenGcaaSayisi: gcaa.olculenSayisi,
    uygunGcaaSayisi: gcaa.uygunSayisi,
    padokFcr,
    padokFcrUyari,
    donemGun: gcaa.donemGun,
    donemBaslangic: gcaa.donemBaslangic,
    donemBitis: gcaa.donemBitis,
    toplamYemKg,
    toplamArtisKg: toplamArtis > 0 ? toplamArtis : null,
    kapsamMetni: gcaa.kapsamMetni + gcaaEk + fcrEk,
    gcaaOzetEtiketi: padokGcaaOzetEtiketi(),
  };
}
