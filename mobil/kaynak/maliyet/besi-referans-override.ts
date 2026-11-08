/**
 * Kullanıcı katmanı — referans katmanından ayrı; null = override yok (LATEST referans).
 */
import { parseKullaniciOndalikFiyat } from './besi-referans-parse';

export type BesiRefOverrideAlan =
  | 'alis_canli_kg'
  | 'satis_canli_kg'
  | 'bolge_satis_kg'
  | 'yem_hazir_kg'
  | 'yem_yonca_kg'
  | 'yem_saman_kg';

export type BesiRefOverrideDepo = Partial<Record<BesiRefOverrideAlan, number>>;

const KEY = 'sy_besi_ref_override_v1';

/** Test/SSR: localStorage yokken bellekte tut */
let bellekOverride: BesiRefOverrideDepo = {};

export function referansOverrideOku(): BesiRefOverrideDepo {
  if (typeof localStorage === 'undefined') return { ...bellekOverride };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BesiRefOverrideDepo;
  } catch {
    return {};
  }
}

export function referansOverrideYaz(depo: BesiRefOverrideDepo): void {
  bellekOverride = { ...depo };
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(depo));
}

export function referansOverrideAyarla(alan: BesiRefOverrideAlan, deger: number | null): BesiRefOverrideDepo {
  const cur = referansOverrideOku();
  if (deger == null) {
    delete cur[alan];
  } else if (deger > 0) {
    cur[alan] = deger;
  }
  referansOverrideYaz(cur);
  return { ...cur };
}

export function referansOverrideTemizle(alan: BesiRefOverrideAlan): BesiRefOverrideDepo {
  return referansOverrideAyarla(alan, null);
}

export type EfektifFiyatKaynak = 'referans' | 'override' | 'eksik';

export function efektifBirimFiyat(
  referans: number | null | undefined,
  alan: BesiRefOverrideAlan,
): { deger: number | null; kaynak: EfektifFiyatKaynak } {
  const o = referansOverrideOku()[alan];
  if (o != null && o > 0) return { deger: o, kaynak: 'override' };
  if (referans != null && referans > 0) return { deger: referans, kaynak: 'referans' };
  return { deger: null, kaynak: 'eksik' };
}

export function kullaniciFiyatGirisindenOverride(
  alan: BesiRefOverrideAlan,
  metin: string,
): { depo: BesiRefOverrideDepo; hata?: string } {
  const p = parseKullaniciOndalikFiyat(metin);
  if (p === 'gecersiz_sifir') return { depo: referansOverrideOku(), hata: 'Fiyat 0 geçersiz — boş bırakın veya pozitif girin.' };
  return { depo: referansOverrideAyarla(alan, p) };
}
