/**
 * Besi plan teknik modeli — kod varsayılanı (admin API ile birleştirilir).
 * TR ırk denemesi sabiti değil; NSW feedlot özet bandı.
 */
export type AdgGrupKodu =
  | 'genel_belirsiz'
  | 'yerli_koyun'
  | 'merinos_tip'
  | 'gelistirilmis_melez'
  | 'yabanci_et';

export type AdgGrupBandModel = {
  muhafazakar: number;
  beklenen: number;
  iyimser: number;
  min: number;
  max: number;
  kaynakAd: string;
  kaynakUrl: string;
  baglam: string;
};

export type BesiPazarUyumModel = {
  irk_belli: number;
  irk_kismen: number;
  irk_bilinmiyor: number;
};

export type BesiBeslemeKatsayiModel = {
  meraGcaaKademeDusus: number;
  disiGcaaDusus: number;
  meraMuhafazakarEkDusus: number;
};

export type BesiModelGovde = {
  surum: number;
  adgGrupBand: Record<AdgGrupKodu, AdgGrupBandModel>;
  pazarUyumDususYuzde: BesiPazarUyumModel;
  beslemeKatsayi: BesiBeslemeKatsayiModel;
};

const NSW =
  'https://www.wool.com/globalassets/mmfs/resources/nsw-dpi-primefact_feedlotting-lambs.pdf';

export const VARSAYILAN_BESI_MODEL_GOVDE: BesiModelGovde = {
  surum: 1,
  adgGrupBand: {
    genel_belirsiz: {
      muhafazakar: 200,
      beklenen: 250,
      iyimser: 320,
      min: 150,
      max: 350,
      kaynakAd: 'NSW DPI Feedlotting lambs',
      kaynakUrl: NSW,
      baglam: '25 kg+ giriş, ırk belirsiz / karışık grup',
    },
    yerli_koyun: {
      muhafazakar: 180,
      beklenen: 230,
      iyimser: 280,
      min: 140,
      max: 300,
      kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
      kaynakUrl: NSW,
      baglam: 'TR yerli koyun — plan bandı (admin düzenleyebilir)',
    },
    merinos_tip: {
      muhafazakar: 200,
      beklenen: 250,
      iyimser: 300,
      min: 160,
      max: 320,
      kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
      kaynakUrl: NSW,
      baglam: 'Merinos tipi — plan bandı (admin düzenleyebilir)',
    },
    gelistirilmis_melez: {
      muhafazakar: 210,
      beklenen: 260,
      iyimser: 310,
      min: 170,
      max: 330,
      kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
      kaynakUrl: NSW,
      baglam: 'Geliştirilmiş melez — plan bandı',
    },
    yabanci_et: {
      muhafazakar: 220,
      beklenen: 270,
      iyimser: 320,
      min: 180,
      max: 350,
      kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
      kaynakUrl: NSW,
      baglam: 'Yabancı et ırkı — plan bandı',
    },
  },
  pazarUyumDususYuzde: {
    irk_belli: 0,
    irk_kismen: 0,
    irk_bilinmiyor: 0,
  },
  beslemeKatsayi: {
    meraGcaaKademeDusus: 0,
    disiGcaaDusus: 15,
    meraMuhafazakarEkDusus: 15,
  },
};
