/**
 * Hayvan adedi paketleri — mağaza / abonelik limitleri.
 * 30 ücretsiz · 50–1000 ücretli kademeler.
 */

export const PAKET_ADETLER = [30, 50, 75, 100, 150, 200, 300, 400, 500, 1000] as const;

export type PaketAdet = (typeof PAKET_ADETLER)[number];

export type SubscriptionTier = `p${PaketAdet}`;

export type PaketTanim = {
  id: SubscriptionTier;
  adet: PaketAdet;
  label: string;
  /** Aylık TL — simülasyon; mağaza fiyatı IAP ile eşlenir */
  monthly: number;
  /** Yıllık TL (~2 ay indirim) */
  yearly: number;
  ucretsiz: boolean;
};

/** Kademeli fiyat — büyük sürüde birim maliyet düşer */
export const PAKET_LISTESI: PaketTanim[] = [
  { id: 'p30', adet: 30, label: '30 kuzu', monthly: 0, yearly: 0, ucretsiz: true },
  { id: 'p50', adet: 50, label: '50 kuzu', monthly: 79, yearly: 790, ucretsiz: false },
  { id: 'p75', adet: 75, label: '75 kuzu', monthly: 99, yearly: 990, ucretsiz: false },
  { id: 'p100', adet: 100, label: '100 kuzu', monthly: 119, yearly: 1190, ucretsiz: false },
  { id: 'p150', adet: 150, label: '150 kuzu', monthly: 149, yearly: 1490, ucretsiz: false },
  { id: 'p200', adet: 200, label: '200 kuzu', monthly: 179, yearly: 1790, ucretsiz: false },
  { id: 'p300', adet: 300, label: '300 kuzu', monthly: 229, yearly: 2290, ucretsiz: false },
  { id: 'p400', adet: 400, label: '400 kuzu', monthly: 279, yearly: 2790, ucretsiz: false },
  { id: 'p500', adet: 500, label: '500 kuzu', monthly: 319, yearly: 3190, ucretsiz: false },
  { id: 'p1000', adet: 1000, label: '1000 kuzu', monthly: 449, yearly: 4490, ucretsiz: false },
];

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
