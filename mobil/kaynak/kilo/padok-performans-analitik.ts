/**
 * Padok düzeyi GCAA/FCR — toplam yem / toplam artış; bireysel oranların ortalaması değil.
 */
import { adgHesapla, type AdgSonuc } from './adg';
import { calculateFCR } from './fcr';
import type { TartimDonemi } from './fcr-hesap';

export type PadokGcaaSatir = {
  animalId: string;
  gcaaGram: number;
  donem: TartimDonemi;
};

export type PadokGcaaOzetHesap = {
  ortGcaaGram: number | null;
  olculenSayisi: number;
  uygunSayisi: number;
  donemGun: number | null;
  donemBaslangic: string | null;
  donemBitis: string | null;
  kapsamMetni: string;
};

export type PadokFcrBirlestirGirdi = {
  toplamYemKg: number;
  toplamArtisKg: number;
  olculenArtisHayvan: number;
  padokBasSayisi: number;
  donemGun: number | null;
};

export type PadokFcrBirlestirSonuc = {
  fcr: number | null;
  uyari: string | null;
};

export function padokGcaaUygunMu(adg: AdgSonuc): adg is Extract<AdgSonuc, { durum: 'hazir' }> {
  return adg.durum === 'hazir';
}

/** Aynı dönem penceresi (maxDays) içinde ölçülen GCAA ortalaması. */
export function padokGcaaOzetHesapla(
  satirlar: { animalId: string; adg: AdgSonuc; maxDays: number }[],
): PadokGcaaOzetHesap {
  const uygun = satirlar.length;
  const olculen: PadokGcaaSatir[] = [];

  for (const s of satirlar) {
    if (!padokGcaaUygunMu(s.adg)) continue;
    const donem = tartimDonemiFromAdg(s.adg);
    if (!donem) continue;
    olculen.push({ animalId: s.animalId, gcaaGram: s.adg.gramGun, donem });
  }

  const ort =
    olculen.length > 0
      ? Math.round(olculen.reduce((a, b) => a + b.gcaaGram, 0) / olculen.length)
      : null;

  let donemGun: number | null = null;
  let donemBaslangic: string | null = null;
  let donemBitis: string | null = null;
  if (olculen.length) {
    donemBaslangic = olculen.map((o) => o.donem.startAt).sort()[0]!;
    donemBitis = olculen.map((o) => o.donem.endAt).sort().reverse()[0]!;
    const gunlar = olculen.map((o) => o.donem.periodDays);
    donemGun = Math.round(gunlar.reduce((a, b) => a + b, 0) / gunlar.length);
  }

  const kapsamMetni =
    olculen.length === 0
      ? `GCAA: 0/${uygun} hayvan (geçerli tartım aralığı yok)`
      : `GCAA: ${olculen.length}/${uygun} hayvan · ~${donemGun ?? '—'} gün`;

  return {
    ortGcaaGram: ort,
    olculenSayisi: olculen.length,
    uygunSayisi: uygun,
    donemGun,
    donemBaslangic,
    donemBitis,
    kapsamMetni,
  };
}

function tartimDonemiFromAdg(adg: Extract<AdgSonuc, { durum: 'hazir' }>): TartimDonemi | null {
  return {
    gainKg: adg.gainKg,
    periodDays: Math.ceil(adg.periodDays),
    startWeightKg: adg.startWeightKg,
    endWeightKg: adg.endWeightKg,
    startAt: adg.startAt,
    endAt: adg.endAt,
  };
}

/** Padok FCR = eşleşen toplam yem / eşleşen toplam canlı artış. */
export function padokFcrBirlestir(g: PadokFcrBirlestirGirdi): PadokFcrBirlestirSonuc {
  let uyari: string | null = null;
  if (g.toplamArtisKg <= 0 || g.olculenArtisHayvan === 0) {
    return { fcr: null, uyari: 'Toplanan canlı ağırlık artışı yok — padok FCR hesaplanamaz' };
  }
  if (g.toplamYemKg <= 0) {
    return { fcr: null, uyari: 'Padok yem tüketimi kaydı yok veya sıfır' };
  }
  if (g.olculenArtisHayvan < g.padokBasSayisi) {
    uyari = `Uyarı: yem tüm padok (${g.padokBasSayisi} baş) için; artış yalnız ${g.olculenArtisHayvan} hayvandan ölçüldü — oran eksik kapsam içindir.`;
  }
  const fcr = calculateFCR(g.toplamYemKg, g.toplamArtisKg);
  return { fcr, uyari };
}

/** Bireysel FCR ortalaması ile toplamdan FCR farklı olabilir — padok için toplam kullanılır. */
export function bireyselFcrOrtalamasiYaniltici(
  bireyselOranlar: number[],
  toplamYemKg: number,
  toplamArtisKg: number,
): boolean {
  if (bireyselOranlar.length < 2 || toplamArtisKg <= 0) return false;
  const ort = bireyselOranlar.reduce((a, b) => a + b, 0) / bireyselOranlar.length;
  const birlestir = calculateFCR(toplamYemKg, toplamArtisKg);
  if (birlestir == null) return false;
  return Math.abs(ort - birlestir) > 0.05;
}

export function padokToplamArtisKg(satirlar: PadokGcaaSatir[]): number {
  return Math.round(satirlar.reduce((s, r) => s + r.donem.gainKg, 0) * 100) / 100;
}

export type SuruFcrParca = { toplamYemKg: number; artisKg: number };

/** Sürü/padok: toplam yem / toplam artış (bireysel FCR ortalaması değil). */
export function suruFcrBirlestir(parcalar: SuruFcrParca[]): {
  fcr: number | null;
  olculenSayisi: number;
  toplamYemKg: number;
  toplamArtisKg: number;
} {
  if (parcalar.length === 0) {
    return { fcr: null, olculenSayisi: 0, toplamYemKg: 0, toplamArtisKg: 0 };
  }
  const toplamYemKg = Math.round(parcalar.reduce((s, p) => s + p.toplamYemKg, 0) * 10) / 10;
  const toplamArtisKg = Math.round(parcalar.reduce((s, p) => s + p.artisKg, 0) * 100) / 100;
  const fcr = calculateFCR(toplamYemKg, toplamArtisKg);
  return { fcr, olculenSayisi: parcalar.length, toplamYemKg, toplamArtisKg };
}

export function ortalamaFcrOranlari(oranlar: number[]): number | null {
  if (oranlar.length === 0) return null;
  return Math.round((oranlar.reduce((s, v) => s + v, 0) / oranlar.length) * 100) / 100;
}
