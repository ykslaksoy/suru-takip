import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubscriptionTier } from '@/kaynak/cekirdek/tipler';
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICES } from '@/kaynak/cekirdek/tipler';

const TIER_KEY = 'suruyon_subscription_tier';
const EXPIRY_KEY = 'suruyon_subscription_expiry';

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const tier = await AsyncStorage.getItem(TIER_KEY);
  if (tier && tier in SUBSCRIPTION_LIMITS) return tier as SubscriptionTier;
  return 'free';
}

export async function setSubscriptionTier(tier: SubscriptionTier, months = 12): Promise<void> {
  await AsyncStorage.setItem(TIER_KEY, tier);
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  await AsyncStorage.setItem(EXPIRY_KEY, expiry.toISOString());
}

export async function getSubscriptionExpiry(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(EXPIRY_KEY);
  return raw ? new Date(raw) : null;
}

export async function isSubscriptionActive(): Promise<boolean> {
  const tier = await getSubscriptionTier();
  if (tier === 'free') return true;
  const expiry = await getSubscriptionExpiry();
  if (!expiry) return false;
  return expiry > new Date();
}

export async function getAnimalLimit(): Promise<number> {
  const tier = await getSubscriptionTier();
  const active = await isSubscriptionActive();
  if (!active && tier !== 'free') return SUBSCRIPTION_LIMITS.free;
  return SUBSCRIPTION_LIMITS[tier];
}

export function getTierInfo(tier: SubscriptionTier) {
  return {
    tier,
    ...SUBSCRIPTION_PRICES[tier],
    limit: SUBSCRIPTION_LIMITS[tier],
  };
}

export async function purchaseSubscription(tier: SubscriptionTier, billing: 'monthly' | 'yearly'): Promise<{ success: boolean; message: string }> {
  if (tier === 'free') {
    await setSubscriptionTier('free');
    return { success: true, message: 'Ücretsiz pakete geçildi.' };
  }

  const price = SUBSCRIPTION_PRICES[tier][billing];
  const months = billing === 'yearly' ? 12 : 1;

  // Simulated IAP — production'da expo-in-app-purchases veya RevenueCat kullanılacak
  await setSubscriptionTier(tier, months);
  return {
    success: true,
    message: `${SUBSCRIPTION_PRICES[tier].label} paketi aktif (${price} TL/${billing === 'yearly' ? 'yıl' : 'ay'}). App Store/Play Store entegrasyonu canlı sürümde tamamlanacak.`,
  };
}
