/** Geriye dönük uyumluluk — başlangıç düzeni */
import { menuOgesiCoz } from './tercih';
import { VARSAYILAN_ANA_SAYFA } from './varsayilan';

export type { MenuOgesi as HizliIslem, MenuOgesi as Kestirme } from './katalog';

export const HIZLI_ISLEMLER = menuOgesiCoz(VARSAYILAN_ANA_SAYFA.hizliIslemIds);
export const KESTIRMELER = menuOgesiCoz(VARSAYILAN_ANA_SAYFA.kestirmeIds);
