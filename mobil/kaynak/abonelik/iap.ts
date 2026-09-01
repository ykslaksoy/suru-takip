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
import { paketBul, VARSAYILAN_PAKET } from './paketler';
export { iapOrtam, iapOrtamAciklama, type IapOrtam } from './iap-ortam';
import { iapOrtam } from './iap-ortam';

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
  if (paketBul(tier).ucretsiz) {
    return {
      success: true,
      message: '30 kuzu ücretsiz paket aktif. Mağaza kaydı yok.',
      tier,
    };
  }
  if (expiry && expiry < new Date()) {
    await setSubscriptionTier(VARSAYILAN_PAKET);
    return {
      success: true,
      message: 'Süresi dolmuş paket 30 kuzu ücretsize alındı.',
      tier: VARSAYILAN_PAKET,
    };
  }
  return {
    success: true,
    message: `${paketBul(tier).label} paketi geri yüklendi (yerel kayıt)${
      expiry ? ` · bitiş ${expiry.toLocaleDateString('tr-TR')}` : ''
    }.`,
    tier,
  };
}
