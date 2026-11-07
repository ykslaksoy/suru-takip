/**
 * Padok bağlamı: kayıtlı aktif plan vs gerçek yemleme (düşüm) — öneri/şablon ayrı.
 */
import type { DusumKaydi } from './kayit';
import type { PartiRasyonu, RasyonKalemi } from './hesap';

export type AktifPlanOzeti = {
  tur: 'aktif' | 'pasif' | 'yok';
  rasyon: PartiRasyonu | null;
  bas: number;
  kgBasGunToplam: number;
  padokGunlukKg: number;
};

export type SonYemlemeOzeti = {
  gun: string;
  zaman: string;
  toplamDusulenKg: number;
  /** Düşüm anındaki rasyon görüntüsü (plan sonradan değişse bile) */
  anlik?: { rasyonId: string; ad?: string; kalemler: RasyonKalemi[] };
  kalemler: { yemAd?: string; stockId: string; dusulen: number; eksik: number }[];
};

export type PadokRasyonDurumu = {
  padok: string;
  bas: number;
  plan: AktifPlanOzeti;
  sonYemleme: SonYemlemeOzeti | null;
  /** Şablon/öneri ile karıştırılmaması için açık etiket */
  oneriNotu: string;
};

export function aktifRasyonBul(rasyonlar: PartiRasyonu[], padok: string): PartiRasyonu | null {
  return rasyonlar.find((r) => r.parti === padok && r.aktif) ?? null;
}

export function pasifRasyonBul(rasyonlar: PartiRasyonu[], padok: string): PartiRasyonu | null {
  return rasyonlar.find((r) => r.parti === padok && !r.aktif) ?? null;
}

export function planOzeti(r: PartiRasyonu | null, bas: number): AktifPlanOzeti {
  if (!r) {
    return { tur: 'yok', rasyon: null, bas, kgBasGunToplam: 0, padokGunlukKg: 0 };
  }
  const kgBasGunToplam = r.kalemler.reduce((s, k) => s + k.kgBasGun, 0);
  return {
    tur: r.aktif ? 'aktif' : 'pasif',
    rasyon: r,
    bas,
    kgBasGunToplam: Math.round(kgBasGunToplam * 1000) / 1000,
    padokGunlukKg: Math.round(kgBasGunToplam * bas * 1000) / 1000,
  };
}

/** Padok için en son gerçek düşüm kaydı */
export function sonYemlemePadok(
  dusumler: DusumKaydi[],
  padok: string,
  yemAdi?: (id: string) => string,
): SonYemlemeOzeti | null {
  for (const d of dusumler) {
    const partiK = d.kalemler.filter((k) => k.parti === padok);
    if (!partiK.length) continue;
    const anlik = d.anlik?.find((a) => a.parti === padok);
    return {
      gun: d.gun,
      zaman: d.zaman,
      toplamDusulenKg: Math.round(partiK.reduce((s, k) => s + k.dusulen, 0) * 100) / 100,
      anlik: anlik
        ? { rasyonId: anlik.rasyonId, ad: anlik.ad, kalemler: anlik.kalemler }
        : undefined,
      kalemler: partiK.map((k) => ({
        stockId: k.stockId,
        yemAd: yemAdi?.(k.stockId),
        dusulen: k.dusulen,
        eksik: k.eksik,
      })),
    };
  }
  return null;
}

export function padokRasyonDurumu(
  padok: string,
  bas: number,
  rasyonlar: PartiRasyonu[],
  dusumler: DusumKaydi[],
  yemAdi?: (id: string) => string,
): PadokRasyonDurumu {
  const aktif = aktifRasyonBul(rasyonlar, padok);
  const pasif = aktif ? null : pasifRasyonBul(rasyonlar, padok);
  const plan = planOzeti(aktif ?? pasif, bas);
  const sonYemleme = sonYemlemePadok(dusumler, padok, yemAdi);
  return {
    padok,
    bas,
    plan,
    sonYemleme,
    oneriNotu: 'Öneri ve referans şablonlar kayıtlı plan değildir; «Uygula / Stokla kaydet» sonrası plan olur.',
  };
}

/** Önerilen şablon id — bilgi; uygulanmış sayılmaz */
export function onerilenSablonId(ortKg: number | null, varsayilanKg: number): string {
  const kg = ortKg ?? varsayilanKg;
  if (kg < 25) return 'besi-baslangic';
  if (kg < 35) return 'besi-buyutme';
  return 'besi-bitirme';
}
