/**
 * IAP adaptörü — tek değişim noktası.
 * Şimdilik: yerel simülasyon (limit.ts).
 * Canlı: RevenueCat / expo-in-app-purchases buraya bağlanır.
 */

import type { SubscriptionTier } from '@/kaynak/cekirdek/tipler';
import {
  getSubscriptionExpiry,
  getSubscriptionTier,
  purchaseSubscription,
  setSubscriptionTier,
} from './limit';

export type IapOrtam = 'simulasyon' | 'magaza';

export function iapOrtam(): IapOrtam {
  const key =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_REVENUECAT_KEY) || '';
  return String(key).trim() ? 'magaza' : 'simulasyon';
}

export function iapOrtamAciklama(): string {
  return iapOrtam() === 'magaza'
    ? 'Mağaza anahtarı tanımlı — gerçek IAP denenebilir.'
    : 'Simülasyon modu — App Store / Play Store anahtarı yok (EXPO_PUBLIC_REVENUECAT_KEY).';
}

export async function iapSatinAl(
  tier: SubscriptionTier,
  billing: 'monthly' | 'yearly'
): Promise<{ success: boolean; message: string }> {
  if (iapOrtam() === 'magaza') {
    // Anahtar var ama SDK bağlanmadı
    return {
      success: false,
      message: 'Mağaza SDK’sı henüz bağlanmadı. Simülasyon için RevenueCat anahtarını kaldırın.',
    };
  }
  return purchaseSubscription(tier, billing);
}

/** Satın alımları geri yükle — simülasyonda mevcut tier’ı doğrular */
export async function iapGeriYukle(): Promise<{ success: boolean; message: string; tier: SubscriptionTier }> {
  const tier = await getSubscriptionTier();
  const expiry = await getSubscriptionExpiry();
  if (tier === 'free') {
    return {
      success: true,
      message: 'Ücretsiz paket aktif. Mağaza kaydı yok.',
      tier,
    };
  }
  if (expiry && expiry < new Date()) {
    await setSubscriptionTier('free');
    return {
      success: true,
      message: 'Süresi dolmuş paket ücretsize alındı.',
      tier: 'free',
    };
  }
  return {
    success: true,
    message: `${tier} paketi geri yüklendi (yerel kayıt)${
      expiry ? ` · bitiş ${expiry.toLocaleDateString('tr-TR')}` : ''
    }.`,
    tier,
  };
}
