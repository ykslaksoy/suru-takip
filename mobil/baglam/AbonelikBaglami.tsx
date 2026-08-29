import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAnimalLimit, getSubscriptionTier, getTierInfo } from '@/kaynak/abonelik/limit';
import { iapGeriYukle, iapOrtamAciklama, iapSatinAl } from '@/kaynak/abonelik/iap';
import { SUBSCRIPTION_PRICES, type SubscriptionTier } from '@/kaynak/cekirdek/tipler';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  limit: number;
  loading: boolean;
  iapAciklama: string;
  refresh: () => Promise<void>;
  purchase: (tier: SubscriptionTier, billing: 'monthly' | 'yearly') => Promise<{ success: boolean; message: string }>;
  restore: () => Promise<{ success: boolean; message: string }>;
  tierLabel: string;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'free',
  limit: 30,
  loading: true,
  iapAciklama: '',
  refresh: async () => {},
  purchase: async () => ({ success: false, message: '' }),
  restore: async () => ({ success: false, message: '' }),
  tierLabel: 'Ücretsiz',
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = await getSubscriptionTier();
    const l = await getAnimalLimit();
    setTier(t);
    setLimit(l);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (newTier: SubscriptionTier, billing: 'monthly' | 'yearly') => {
      const result = await iapSatinAl(newTier, billing);
      if (result.success) await refresh();
      return result;
    },
    [refresh]
  );

  const restore = useCallback(async () => {
    const result = await iapGeriYukle();
    await refresh();
    return { success: result.success, message: result.message };
  }, [refresh]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        limit,
        loading,
        iapAciklama: iapOrtamAciklama(),
        refresh,
        purchase,
        restore,
        tierLabel: getTierInfo(tier).label,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export { SUBSCRIPTION_PRICES };
