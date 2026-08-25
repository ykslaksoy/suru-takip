import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAnimalLimit, getSubscriptionTier, getTierInfo, purchaseSubscription } from '@/lib/subscription';
import { SUBSCRIPTION_PRICES, type SubscriptionTier } from '@/lib/types';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  limit: number;
  loading: boolean;
  refresh: () => Promise<void>;
  purchase: (tier: SubscriptionTier, billing: 'monthly' | 'yearly') => Promise<{ success: boolean; message: string }>;
  tierLabel: string;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'free',
  limit: 30,
  loading: true,
  refresh: async () => {},
  purchase: async () => ({ success: false, message: '' }),
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
    refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (newTier: SubscriptionTier, billing: 'monthly' | 'yearly') => {
      const result = await purchaseSubscription(newTier, billing);
      if (result.success) await refresh();
      return result;
    },
    [refresh]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        limit,
        loading,
        refresh,
        purchase,
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
