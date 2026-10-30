import type { SubscriptionTier } from './paketler';
import { paketBul, tierGecerliMi } from './paketler';
/**
 * IAP ortam tespiti — RevenueCat (Web Billing / Web Purchase Link + REST).
 * Simülasyon modu YOK: anahtar yoksa ücretli satın alma kapalıdır.
 */

export type IapOrtam = 'revenuecat' | 'yapilandirilmamis';

export type IapAyar = { anahtar: string; satinAlmaLinki: string; entitlementOnek: string };

export function iapAyar(): IapAyar | null {
  const anahtar = String(process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '').trim();
  const satinAlmaLinki = String(process.env.EXPO_PUBLIC_REVENUECAT_PURCHASE_LINK ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!anahtar || !/^https:\/\//.test(satinAlmaLinki)) return null;
  return { anahtar, satinAlmaLinki, entitlementOnek: 'p' };
}

export function iapOrtam(): IapOrtam {
  return iapAyar() ? 'revenuecat' : 'yapilandirilmamis';
}

export function iapOrtamAciklama(): string {
  return iapOrtam() === 'revenuecat'
    ? 'Ödeme RevenueCat güvenli ödeme sayfasında alınır; abonelik mağaza kaydından doğrulanır.'
    : 'Ücretli ödeme altyapısı bu sürümde yapılandırılmadı — ücretsiz paket ve deneme kullanılabilir.';
}

export function satinAlmaUrl(link: string, appUserId: string, tier: SubscriptionTier, billing: 'monthly' | 'yearly'): string {
  const paketKimligi = `${tier}_${billing === 'yearly' ? 'yillik' : 'aylik'}`;
  return `${link}/${encodeURIComponent(appUserId)}?package_id=${encodeURIComponent(paketKimligi)}`;
}

export type RcAbone = {
  subscriber?: { entitlements?: Record<string, { expires_date: string | null; product_identifier?: string }> };
};

/** RevenueCat abone yanıtından en büyük aktif paketi seç */
export function aktifPaketCoz(json: RcAbone, simdi = new Date()): { tier: SubscriptionTier; bitis: Date | null } | null {
  const ent = json.subscriber?.entitlements ?? {};
  let en: { tier: SubscriptionTier; bitis: Date | null } | null = null;
  for (const [kimlik, e] of Object.entries(ent)) {
    const bitis = e.expires_date ? new Date(e.expires_date) : null;
    if (bitis && bitis <= simdi) continue;
    const aday = kimlik.match(/^p\d+$/) ? kimlik : (e.product_identifier ?? '').match(/p\d+/)?.[0] ?? '';
    if (!tierGecerliMi(aday)) continue;
    if (!en || paketBul(aday).adet > paketBul(en.tier).adet) en = { tier: aday, bitis };
  }
  return en;
}

