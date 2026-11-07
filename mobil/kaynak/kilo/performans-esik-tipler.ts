import type { RationPhase } from '@/kaynak/rasyon/hesapla';
import { PERFORMANS_METRIK } from '@/kaynak/kilo/performans-metrik-etiket';

/** Çiftlik hedefi — tıbbi normal aralık değil. */
export type PerformansEsikMetrik = 'gcaa_alt' | 'fcr_ust';

export type PerformansEsikKapsam =
  | { tur: 'genel' }
  | { tur: 'padok'; padokAd: string }
  | { tur: 'faz'; faz: RationPhase }
  | { tur: 'padok_faz'; padokAd: string; faz: RationPhase };

export type PerformansEsikDeger = {
  etkin: boolean;
  /** GCAA: g/gün · FCR: kg yem/kg artış */
  deger: number;
};

export type PerformansEsikKayit = {
  id: string;
  kapsam: PerformansEsikKapsam;
  gcaaAlt: PerformansEsikDeger | null;
  fcrUst: PerformansEsikDeger | null;
  guncelleme: string;
};

export type PerformansEsikDepo = {
  surum: 1;
  kayitlar: PerformansEsikKayit[];
};

export const GCAA_BIRIM = PERFORMANS_METRIK.GCAA.birim;
export const FCR_BIRIM = PERFORMANS_METRIK.FCR.birim;

/** Makul üst/alt — evrensel “normal” değil, yalnızca giriş doğrulaması. */
export const GCAA_DOGRULAMA = { min: 1, max: 2000 } as const;
export const FCR_DOGRULAMA = { min: 0.5, max: 50 } as const;

export type EsikDogrulama =
  | { ok: true; deger: number }
  | { ok: false; hata: string };

function sonluMu(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function gcaaEsikDogrula(ham: unknown): EsikDogrulama {
  if (!sonluMu(ham)) return { ok: false, hata: 'GCAA hedefi sayı olmalı' };
  if (ham < GCAA_DOGRULAMA.min || ham > GCAA_DOGRULAMA.max) {
    return { ok: false, hata: `GCAA ${GCAA_DOGRULAMA.min}–${GCAA_DOGRULAMA.max} ${GCAA_BIRIM} aralığında olmalı` };
  }
  if (ham > 50 && ham < 5000) {
    /* kg/gün ile karışma: 0.2 kg/gün = 200 g/gün — 1–3 arası kg/gün şüpheli */
  }
  if (ham > 0 && ham < 3) {
    return {
      ok: false,
      hata: `Değer kg/gün gibi görünüyor; GCAA hedefi ${GCAA_BIRIM} ile girin (ör. 200 g/gün için 200).`,
    };
  }
  return { ok: true, deger: Math.round(ham) };
}

export function fcrEsikDogrula(ham: unknown): EsikDogrulama {
  if (!sonluMu(ham)) return { ok: false, hata: 'FCR hedefi sayı olmalı' };
  if (ham < FCR_DOGRULAMA.min || ham > FCR_DOGRULAMA.max) {
    return { ok: false, hata: `FCR ${FCR_DOGRULAMA.min}–${FCR_DOGRULAMA.max} ${FCR_BIRIM} aralığında olmalı` };
  }
  if (ham > 100) {
    return { ok: false, hata: `FCR oran değildir; ${FCR_BIRIM} biriminde girin (ör. 6.5).` };
  }
  return { ok: true, deger: Math.round(ham * 100) / 100 };
}

export function performansEsikDegerBos(): PerformansEsikDeger | null {
  return null;
}

export function kapsamAnahtar(k: PerformansEsikKapsam): string {
  if (k.tur === 'genel') return 'genel';
  if (k.tur === 'padok') return `padok:${normPadok(k.padokAd)}`;
  if (k.tur === 'faz') return `faz:${k.faz}`;
  return `padok_faz:${normPadok(k.padokAd)}:${k.faz}`;
}

export function normPadok(ad: string): string {
  return ad.trim().toLocaleLowerCase('tr-TR');
}
