/** Kullanıcı arayüzünde görünen sabit metinler — yalnızca Türkçe. */

export const BETA_KATEGORILER = {
  general: 'Genel',
  bug: 'Hata bildirimi',
  feature: 'Özellik isteği',
} as const;

export type BetaKategori = keyof typeof BETA_KATEGORILER;

/** Kısa terim + Türkçe açıklama — arayüzde birlikte gösterilir. */
export const TERIMLER = {
  ADG: { kisa: 'ADG', aciklama: 'günlük kilo alım miktarı' },
  FCR: { kisa: 'FCR', aciklama: '1 kg et için kaç kg yem gerekir' },
  T1: { kisa: 'T1', aciklama: 'ilk tartım' },
  BCS: { kisa: 'BCS', aciklama: 'vücut kondisyon skoru' },
  SKT: { kisa: 'SKT', aciklama: 'son kullanma tarihi' },
  GEKIS: { kisa: 'GEKİS', aciklama: 'elektronik hayvan kimlik sistemi' },
  TURKVET: { kisa: 'TÜRKVET', aciklama: 'ulusal hayvan tanımlama ve kayıt sistemi' },
  JSON: { kisa: 'JSON', aciklama: 'veri dosyası formatı' },
  FIT: { kisa: 'Fit', aciklama: 'form tutuyor (derece)' },
  SPORTMEN: { kisa: 'Sportmen', aciklama: 'formda (derece)' },
} as const;

export type TerimAnahtar = keyof typeof TERIMLER;

/** Örn. "FCR (1 kg et için kaç kg yem gerekir)" */
export function terim(key: TerimAnahtar): string {
  const t = TERIMLER[key];
  return `${t.kisa} (${t.aciklama})`;
}

/** Yalnızca kısa ad — örn. "ADG" */
export function terimKisa(key: TerimAnahtar): string {
  return TERIMLER[key].kisa;
}

/** ADG değer metni — örn. "+250 g/gün · 0,25 kg/gün" */
export function adgDeger(gramGun: number): string {
  const kgGun = Math.round((gramGun / 1000) * 1000) / 1000;
  return `+${gramGun} g/gün · ${kgGun.toLocaleString('tr-TR')} kg/gün`;
}

/** FCR değer metni — örn. "4,2 kg yem / 1 kg artış" */
export function fcrDeger(orani: number): string {
  return `${orani.toLocaleString('tr-TR')} kg yem / 1 kg artış`;
}

/** Yem (kg/gün) ile ADG (g/gün) karışmasın diye tablo satırı */
export type YemAdgTabloSatiri = {
  gosterge: string;
  deger: string;
  birim: string;
  not: string;
  vurgu?: boolean;
};

/** Performans ekranı — günlük yem + ADG + karşılaştırmalı örnekler (notlu). */
export function yemAdgPerformansTablosu(opts: {
  gunlukYemKg?: number | null;
  adgGram?: number | null;
}): YemAdgTabloSatiri[] {
  const satirlar: YemAdgTabloSatiri[] = [];

  satirlar.push({
    gosterge: 'Günlük yem',
    deger: opts.gunlukYemKg != null ? opts.gunlukYemKg.toLocaleString('tr-TR') : '—',
    birim: 'kg/gün',
    not: 'Günde verilen yem miktarı. Canlı ağırlık artışı (ADG) değildir.',
    vurgu: opts.gunlukYemKg != null,
  });

  satirlar.push({
    gosterge: terim('ADG'),
    deger:
      opts.adgGram != null
        ? `+${opts.adgGram} g/gün · ${(opts.adgGram / 1000).toLocaleString('tr-TR')} kg/gün`
        : '—',
    birim: '30 gün ort.',
    not: 'Tartımlardan: günde alınan canlı ağırlık artışı. Yem kg/gün ile karıştırılmaz.',
    vurgu: opts.adgGram != null,
  });

  satirlar.push({
    gosterge: 'Örnek · yem',
    deger: '0,8',
    birim: 'kg/gün yem',
    not: 'FCR 5,5 ile → ~145 g/gün ADG · 3 ayda (~90 gün) ~13 kg canlı artış',
  });

  satirlar.push({
    gosterge: 'Örnek · ADG',
    deger: '0,8',
    birim: 'kg/gün artış',
    not: '3 ayda ~72 kg artış — kuzu besisi için gerçekçi değil (yem sanılmasın)',
  });

  return satirlar;
}

export const UI_KURAL =
  'Tüm ekran metinleri Türkçe olmalıdır. Kısa terimler (ADG, FCR, T1, SKT vb.) kısaltma + parantez içinde açıklama ile gösterilir.';
