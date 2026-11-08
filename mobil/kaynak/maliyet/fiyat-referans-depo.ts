import type { FiyatReferansTablosu } from './fiyat-referans';
import { FIYAT_REFERANS_TABLOSU } from './fiyat-referans';

const KEY = 'sy_besi_fiyat_referans_v1';

export type FiyatReferansDepoMeta = {
  sonYenileme: string | null;
  yenilemeSonuc: 'gömülü_ok' | 'önbellek_ok' | 'bayat' | 'hata' | null;
  iz: string[];
};

export function fiyatReferansDepoOku(): FiyatReferansTablosu {
  if (typeof localStorage === 'undefined') return FIYAT_REFERANS_TABLOSU;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FIYAT_REFERANS_TABLOSU;
    const p = JSON.parse(raw) as { tablo?: FiyatReferansTablosu };
    if (!p.tablo?.kalemler?.length) return FIYAT_REFERANS_TABLOSU;
    return p.tablo;
  } catch {
    return FIYAT_REFERANS_TABLOSU;
  }
}

export function fiyatReferansDepoYaz(tablo: FiyatReferansTablosu, meta: FiyatReferansDepoMeta): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify({ tablo, meta }));
}

export function fiyatReferansDepoMetaOku(): FiyatReferansDepoMeta {
  if (typeof localStorage === 'undefined') {
    return { sonYenileme: null, yenilemeSonuc: 'gömülü_ok', iz: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { sonYenileme: null, yenilemeSonuc: null, iz: [] };
    const p = JSON.parse(raw) as { meta?: FiyatReferansDepoMeta };
    return p.meta ?? { sonYenileme: null, yenilemeSonuc: null, iz: [] };
  } catch {
    return { sonYenileme: null, yenilemeSonuc: 'hata', iz: [] };
  }
}
