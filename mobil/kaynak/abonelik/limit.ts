import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  paketAdetLimit,
  paketBul,
  paketHayvanIcin,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_PRICES,
  tierNormalize,
  UCRETSIZ_DENEME_AY,
  VARSAYILAN_PAKET,
  type SubscriptionTier,
} from '@/kaynak/abonelik/paketler';

const TIER_KEY = 'suruyon_subscription_tier';
const EXPIRY_KEY = 'suruyon_subscription_expiry';
const DENEME_KEY = 'suruyon_deneme_kullanildi';
const DENEME_BITIS_KEY = 'suruyon_deneme_bitis';

export async function denemeKullanildiMi(): Promise<boolean> {
  return (await AsyncStorage.getItem(DENEME_KEY)) === '1';
}

export async function denemeHakkiVarMi(): Promise<boolean> {
  return !(await denemeKullanildiMi());
}

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const tier = await AsyncStorage.getItem(TIER_KEY);
  return tierNormalize(tier);
}

export async function setSubscriptionTier(tier: SubscriptionTier, months = 12): Promise<void> {
  await AsyncStorage.setItem(TIER_KEY, tier);
  const paket = paketBul(tier);
  if (paket.ucretsiz) {
    await AsyncStorage.removeItem(EXPIRY_KEY);
    return;
  }
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
  const paket = paketBul(tier);
  if (paket.ucretsiz) return true;
  const expiry = await getSubscriptionExpiry();
  if (!expiry) return false;
  return expiry > new Date();
}

/** Deneme süresindeyse kalan gün */
export async function getDenemeKalanGun(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(DENEME_BITIS_KEY);
  if (!raw) return null;
  const gun = Math.ceil((new Date(raw).getTime() - Date.now()) / 86400000);
  return gun > 0 ? gun : null;
}

export async function getAnimalLimit(): Promise<number> {
  const tier = await getSubscriptionTier();
  const active = await isSubscriptionActive();
  if (!active && !paketBul(tier).ucretsiz) return paketAdetLimit(VARSAYILAN_PAKET);
  return SUBSCRIPTION_LIMITS[tier];
}

export function getTierInfo(tier: SubscriptionTier) {
  return {
    tier,
    ...SUBSCRIPTION_PRICES[tier],
    limit: SUBSCRIPTION_LIMITS[tier],
  };
}

export async function purchaseSubscription(
  tier: SubscriptionTier,
  billing: 'monthly' | 'yearly',
): Promise<{ success: boolean; message: string }> {
  const paket = paketBul(tier);
  if (paket.ucretsiz) {
    await setSubscriptionTier(VARSAYILAN_PAKET);
    return { success: true, message: '30 kuzu ücretsiz pakete geçildi.' };
  }

  const price = SUBSCRIPTION_PRICES[tier][billing];
  const billingEtiket = billing === 'yearly' ? 'yıl' : 'ay';

  if (await denemeHakkiVarMi()) {
    const bitis = new Date();
    bitis.setMonth(bitis.getMonth() + UCRETSIZ_DENEME_AY);
    await setSubscriptionTier(tier, UCRETSIZ_DENEME_AY);
    await AsyncStorage.setItem(DENEME_KEY, '1');
    await AsyncStorage.setItem(DENEME_BITIS_KEY, bitis.toISOString());
    return {
      success: true,
      message:
        `${paket.label} · ${UCRETSIZ_DENEME_AY} ay ücretsiz deneme başladı. ` +
        `Deneme bitince ${price} TL/${billingEtiket} (simülasyon · mağaza IAP sonraki sürüm).`,
    };
  }

  const months = billing === 'yearly' ? 12 : 1;
  await AsyncStorage.removeItem(DENEME_BITIS_KEY);
  await setSubscriptionTier(tier, months);
  return {
    success: true,
    message: `${paket.label} paketi aktif (${price} TL/${billingEtiket}). App Store/Play Store entegrasyonu canlı sürümde tamamlanacak.`,
  };
}

/** Mevcut hayvan sayısı paketi aşıyorsa deneme / uygun pakete yükselt */
export async function limitAsimindaPaketAc(hayvanSayisi: number): Promise<{
  success: boolean;
  message: string;
  tier: SubscriptionTier;
}> {
  const limit = await getAnimalLimit();
  if (hayvanSayisi <= limit) {
    return {
      success: true,
      message: 'Limit yeterli.',
      tier: await getSubscriptionTier(),
    };
  }
  const hedef = paketHayvanIcin(Math.max(hayvanSayisi + 10, 50));
  const sonuc = await purchaseSubscription(hedef.id, 'monthly');
  return { ...sonuc, tier: hedef.id };
}
