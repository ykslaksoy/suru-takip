import type { StockItem } from '@/kaynak/cekirdek/tipler';

export {
  STOK_KATALOGU,
  YEM_KATALOGU,
  TAKVIYE_KATALOGU,
  ILAC_KATALOGU,
  ASI_KATALOGU,
  PARAZIT_KATALOGU,
  katalogByType,
  katalogEsles,
  type StokKatalogKalemi,
} from './katalog';

export {
  getSiraliStokListesi,
  getKullanimSkorlari,
  kaydetKatalogKullanim,
  clearKatalogKullanim,
  siralaKatalog,
  type StokListeSatiri,
} from './kullanim';

/** Geriye dönük yardımcılar */
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
