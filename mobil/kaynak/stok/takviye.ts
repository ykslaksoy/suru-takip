import type { StockItem } from '@/kaynak/cekirdek/tipler';

/** Sık kullanılan takviye gıdalar — stok eklerken hızlı seçim */
export type TakviyeOrnek = {
  id: string;
  ad: string;
  birim: string;
  minMiktar: number;
  aciklama: string;
};

export const TAKVIYE_KATALOGU: TakviyeOrnek[] = [
  {
    id: 'mineral-yalama',
    ad: 'Mineral yalama taşı',
    birim: 'adet',
    minMiktar: 2,
    aciklama: 'Padokta serbest yalama',
  },
  {
    id: 'tuz',
    ad: 'Hayvan tuzu',
    birim: 'kg',
    minMiktar: 10,
    aciklama: 'Serbest veya rasyona karışık',
  },
  {
    id: 'premiks',
    ad: 'Vitamin-mineral premiks',
    birim: 'kg',
    minMiktar: 5,
    aciklama: 'Yeme karıştırılır',
  },
  {
    id: 'melas',
    ad: 'Melas',
    birim: 'kg',
    minMiktar: 20,
    aciklama: 'İştah / enerji takviyesi',
  },
  {
    id: 'selen-e',
    ad: 'Selenyum + E vitamini',
    birim: 'ml',
    minMiktar: 100,
    aciklama: 'Eksiklik bölgelerinde',
  },
  {
    id: 'probiyotik',
    ad: 'Probiyotik / rumen mayası',
    birim: 'kg',
    minMiktar: 2,
    aciklama: 'Sindirim desteği',
  },
  {
    id: 'soda',
    ad: 'Sodyum bikarbonat (soda)',
    birim: 'kg',
    minMiktar: 5,
    aciklama: 'Asidoz riskine tampon',
  },
  {
    id: 'kirec',
    ad: 'Kalsiyum / kireç taşı',
    birim: 'kg',
    minMiktar: 10,
    aciklama: 'Kemik ve süt desteği',
  },
];

export function dusukTakviyeler(items: StockItem[]): StockItem[] {
  return items.filter((i) => i.type === 'supplement' && i.quantity <= i.minQuantity);
}

export function sktYakinTakviyeler(items: StockItem[], gun = 60): StockItem[] {
  const limit = Date.now() + gun * 86400000;
  return items.filter(
    (i) =>
      i.type === 'supplement' &&
      i.expiryDate &&
      new Date(i.expiryDate).getTime() <= limit &&
      new Date(i.expiryDate).getTime() >= Date.now()
  );
}
