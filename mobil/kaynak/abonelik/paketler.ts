/**
 * Hayvan adedi paketleri — mağaza / abonelik limitleri.
 * 30 ücretsiz · 50–1000 ücretli kademeler · 1 TL / kuzu / ay.
 */

export const PAKET_ADETLER = [30, 50, 75, 100, 150, 200, 300, 400, 500, 1000] as const;

export type PaketAdet = (typeof PAKET_ADETLER)[number];

export type SubscriptionTier = `p${PaketAdet}`;

/** Ücretli paketlerde aylık kuzu başı TL */
export const KUZU_BASI_AYLIK_TL = 1;

/** Yıllık = 10 ay bedeli (2 ay indirim) */
export const YILLIK_AY_ESDEGER = 10;

export type PaketTanim = {
  id: SubscriptionTier;
  adet: PaketAdet;
  label: string;
  /** Aylık TL — adet × KUZU_BASI_AYLIK_TL (ücretsiz pakette 0) */
  monthly: number;
  /** Yıllık TL — adet × YILLIK_AY_ESDEGER */
  yearly: number;
  ucretsiz: boolean;
};

function paketFiyat(adet: PaketAdet, ucretsiz: boolean): { monthly: number; yearly: number } {
  if (ucretsiz) return { monthly: 0, yearly: 0 };
  return {
    monthly: adet * KUZU_BASI_AYLIK_TL,
    yearly: adet * YILLIK_AY_ESDEGER,
  };
}

export const PAKET_LISTESI: PaketTanim[] = PAKET_ADETLER.map((adet) => {
  const ucretsiz = adet === 30;
  const fiyat = paketFiyat(adet, ucretsiz);
  return {
    id: `p${adet}` as SubscriptionTier,
    adet,
    label: `${adet} kuzu`,
    ...fiyat,
    ucretsiz,
  };
});

export const VARSAYILAN_PAKET: SubscriptionTier = 'p30';

/** Eski tier anahtarları → yeni paket */
export const LEGACY_TIER_MAP: Record<string, SubscriptionTier> = {
  free: 'p30',
  farmer: 'p200',
  professional: 'p1000',
  enterprise: 'p1000',
};

export function tierGecerliMi(tier: string): tier is SubscriptionTier {
  return PAKET_LISTESI.some((p) => p.id === tier);
}

export function paketBul(id: SubscriptionTier): PaketTanim {
  return PAKET_LISTESI.find((p) => p.id === id) ?? PAKET_LISTESI[0];
}

export function paketAdetLimit(id: SubscriptionTier): number {
  return paketBul(id).adet;
}

export function tierNormalize(raw: string | null): SubscriptionTier {
  if (!raw) return VARSAYILAN_PAKET;
  if (tierGecerliMi(raw)) return raw;
  return LEGACY_TIER_MAP[raw] ?? VARSAYILAN_PAKET;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, number> = Object.fromEntries(
  PAKET_LISTESI.map((p) => [p.id, p.adet]),
) as Record<SubscriptionTier, number>;

export const SUBSCRIPTION_PRICES: Record<
  SubscriptionTier,
  { monthly: number; yearly: number; label: string }
> = Object.fromEntries(
  PAKET_LISTESI.map((p) => [p.id, { monthly: p.monthly, yearly: p.yearly, label: p.label }]),
) as Record<SubscriptionTier, { monthly: number; yearly: number; label: string }>;
