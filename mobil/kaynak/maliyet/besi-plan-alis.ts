/**
 * Planlama alışı — kullanıcı varsayımı; canlı borsa / satış fiyatı değil.
 */
import type { PartiGercekMaliyetOzet } from '@/kaynak/maliyet/besi-ekonomi-gercek';

export const VARSAYILAN_ALIS_CANLI_KG_FIYAT = 500;

export const ALIS_KAYNAK_ETIKET = {
  kullanici_planlama_varsayimi: 'Kullanıcı planlama varsayımı',
  basina_girildi: '₺/baş (plan alanı)',
  gercek_parti: 'Gerçek parti alışı (Maliyet ve Kâr)',
  eksik: 'Eksik — hesaplanmaz',
} as const;

export type PlanAlisKaynak = keyof typeof ALIS_KAYNAK_ETIKET;

export function sayiPlanAlis(m: string): number | null {
  const t = m.trim();
  if (!t) return null;
  const n = parseFloat(t.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function alisBasCanliKgden(kgFiyat: number, girisKg: number): number | null {
  if (!Number.isFinite(kgFiyat) || kgFiyat <= 0 || !Number.isFinite(girisKg) || girisKg <= 0) return null;
  return Math.round(kgFiyat * girisKg);
}

export function cozPlanAlisBas(g: {
  alisBasFiyat: number | null;
  alisCanliKgFiyat: number | null;
  girisKg: number | null;
  gercekParti?: PartiGercekMaliyetOzet | null;
  basSayisi?: number | null;
}): {
  alisBas: number | null;
  kaynak: PlanAlisKaynak;
  etiket: string;
  kgFiyatKullanilan: number | null;
  ciftSayimUyarisi: string | null;
} {
  if (g.gercekParti && g.gercekParti.alis > 0 && g.gercekParti.bas > 0) {
    const bas = Math.round(g.gercekParti.alis / g.gercekParti.bas);
    return {
      alisBas: bas,
      kaynak: 'gercek_parti',
      etiket: ALIS_KAYNAK_ETIKET.gercek_parti,
      kgFiyatKullanilan: null,
      ciftSayimUyarisi: 'Gerçek parti alışı kullanılıyor — ekonomi alış kalemini projeksiyonda kapatın.',
    };
  }

  if (g.alisBasFiyat != null && g.alisBasFiyat > 0) {
    return {
      alisBas: Math.round(g.alisBasFiyat),
      kaynak: 'basina_girildi',
      etiket: ALIS_KAYNAK_ETIKET.basina_girildi,
      kgFiyatKullanilan: null,
      ciftSayimUyarisi: null,
    };
  }

  if (g.alisCanliKgFiyat != null && g.alisCanliKgFiyat > 0 && g.girisKg != null && g.girisKg > 0) {
    const bas = alisBasCanliKgden(g.alisCanliKgFiyat, g.girisKg);
    return {
      alisBas: bas,
      kaynak: 'kullanici_planlama_varsayimi',
      etiket: ALIS_KAYNAK_ETIKET.kullanici_planlama_varsayimi,
      kgFiyatKullanilan: g.alisCanliKgFiyat,
      ciftSayimUyarisi: null,
    };
  }

  return {
    alisBas: null,
    kaynak: 'eksik',
    etiket: ALIS_KAYNAK_ETIKET.eksik,
    kgFiyatKullanilan: null,
    ciftSayimUyarisi: null,
  };
}

/** Yeni taslak için önerilen başlangıç — kayıtlı planı ezmez */
export function yeniPlanVarsayilanAlisKgFiyat(): number {
  return VARSAYILAN_ALIS_CANLI_KG_FIYAT;
}
