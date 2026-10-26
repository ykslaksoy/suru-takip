export type CariTur = 'yemci' | 'tuccar' | 'alici' | 'veteriner' | 'diger';

export type CariIslemTur = 'borc' | 'alis' | 'odeme' | 'tahsilat' | 'vade';

export type CariHesap = {
  id: string;
  ad: string;
  tur: CariTur;
  telefon: string;
  not: string;
  createdAt: string;
};

export type CariIslem = {
  id: string;
  cariId: string;
  tur: CariIslemTur;
  tutar: number;
  /** YYYY-MM-DD */
  tarih: string;
  not: string;
  /** vade için son ödeme tarihi */
  vadeTarihi?: string;
  createdAt: string;
};

export const CARI_TUR_ETIKET: Record<CariTur, string> = {
  yemci: 'Yemci',
  tuccar: 'Tüccar',
  alici: 'Alıcı',
  veteriner: 'Veteriner',
  diger: 'Diğer',
};

export const CARI_ISLEM_ETIKET: Record<CariIslemTur, string> = {
  borc: 'Borç (alacak)',
  alis: 'Alış',
  odeme: 'Ödeme',
  tahsilat: 'Tahsilat',
  vade: 'Vade notu',
};
