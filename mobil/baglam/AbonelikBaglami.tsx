import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAnimalLimit, getDenemeKalanGun, getSubscriptionTier, getTierInfo, denemeHakkiVarMi } from '@/kaynak/abonelik/limit';
import { iapGeriYukle, iapOrtamAciklama, iapSatinAl } from '@/kaynak/abonelik/iap';
import { UCRETSIZ_DENEME_AY, VARSAYILAN_PAKET, type SubscriptionTier } from '@/kaynak/abonelik/paketler';
import { SUBSCRIPTION_PRICES } from '@/kaynak/abonelik/paketler';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  limit: number;
  loading: boolean;
  iapAciklama: string;
  refresh: () => Promise<void>;
  purchase: (tier: SubscriptionTier, billing: 'monthly' | 'yearly') => Promise<{ success: boolean; message: string }>;
  restore: () => Promise<{ success: boolean; message: string }>;
  tierLabel: string;
  denemeHakki: boolean;
  denemeKalanGun: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: VARSAYILAN_PAKET,
  limit: 30,
  loading: true,
  iapAciklama: '',
  refresh: async () => {},
  purchase: async () => ({ success: false, message: '' }),
  restore: async () => ({ success: false, message: '' }),
  tierLabel: '30 kuzu',
  denemeHakki: true,
  denemeKalanGun: null,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { ready } = useDatabase();
  const [tier, setTier] = useState<SubscriptionTier>(VARSAYILAN_PAKET);
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [denemeHakki, setDenemeHakki] = useState(true);
  const [denemeKalanGun, setDenemeKalanGun] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const t = await getSubscriptionTier();
    const l = await getAnimalLimit();
    setTier(t);
    setLimit(l);
    setDenemeHakki(await denemeHakkiVarMi());
    setDenemeKalanGun(await getDenemeKalanGun());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

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
        denemeHakki,
        denemeKalanGun,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export { SUBSCRIPTION_PRICES };
