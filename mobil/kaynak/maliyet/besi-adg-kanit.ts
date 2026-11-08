/** Literatür tabanlı GCAA aralıkları — ırk belirsiz, tavan garantisi değil. */

export type AdgKanitSenaryo = 'beklenen' | 'iyimser' | 'muhafazakar';

export type AdgKanitKaydi = {
  senaryo: AdgKanitSenaryo;
  gcaaGramGun: number;
  min: number;
  max: number;
  kaynakAd: string;
  kaynakUrl: string;
  not: string;
};

export const ADG_KANIT_KAYITLARI: AdgKanitKaydi[] = [
  {
    senaryo: 'beklenen',
    gcaaGramGun: 250,
    min: 200,
    max: 320,
    kaynakAd: 'NSW DPI Feedlotting lambs (Primefact)',
    kaynakUrl: 'https://www.wool.com/globalassets/mmfs/resources/nsw-dpi-primefact_feedlotting-lambs.pdf',
    not: '25 kg+ giriş için planlama ~250 g/gün; aralık 200–320',
  },
  {
    senaryo: 'iyimser',
    gcaaGramGun: 320,
    min: 250,
    max: 350,
    kaynakAd: 'NSW DPI üst aralık / iyi yemleme',
    kaynakUrl: 'https://www.wool.com/globalassets/mmfs/resources/nsw-dpi-primefact_feedlotting-lambs.pdf',
    not: 'İyimser senaryo — genetik tavan değil',
  },
  {
    senaryo: 'muhafazakar',
    gcaaGramGun: 200,
    min: 150,
    max: 250,
    kaynakAd: 'NSW DPI alt aralık',
    kaynakUrl: 'https://www.wool.com/globalassets/mmfs/resources/nsw-dpi-primefact_feedlotting-lambs.pdf',
    not: 'Zayıf adaptasyon / düşük yemleme',
  },
];

export function kanitGcaa(senaryo: AdgKanitSenaryo): AdgKanitKaydi {
  return ADG_KANIT_KAYITLARI.find((k) => k.senaryo === senaryo) ?? ADG_KANIT_KAYITLARI[0];
}

export function hedefCanliKgKanit(girisKg: number, gun: number, senaryo: AdgKanitSenaryo): number {
  const k = kanitGcaa(senaryo);
  const artis = (k.gcaaGramGun / 1000) * gun;
  return Math.round((girisKg + artis) * 10) / 10;
}
