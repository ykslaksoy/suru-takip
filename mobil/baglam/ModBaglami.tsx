import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  URUN_MODLARI,
  getAktifModId,
  getMod,
  setAktifModId,
  type UrunMod,
  type UrunModId,
} from '@/sabitler/Modlar';

interface ModContextValue {
  loading: boolean;
  aktifId: UrunModId;
  aktifMod: UrunMod;
  modlar: UrunMod[];
  refresh: () => Promise<void>;
  secMod: (id: UrunModId) => Promise<UrunMod>;
}

const ModContext = createContext<ModContextValue>({
  loading: true,
  aktifId: 'mod1',
  aktifMod: URUN_MODLARI[0],
  modlar: URUN_MODLARI,
  refresh: async () => {},
  secMod: async () => URUN_MODLARI[0],
});

export function ModProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [aktifId, setAktifId] = useState<UrunModId>('mod1');

  const refresh = useCallback(async () => {
    const id = await getAktifModId();
    setAktifId(id);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const secMod = useCallback(async (id: UrunModId) => {
    await setAktifModId(id);
    setAktifId(id);
    return getMod(id);
  }, []);

  const aktifMod = useMemo(() => getMod(aktifId), [aktifId]);

  return (
    <ModContext.Provider
      value={{
        loading,
        aktifId,
        aktifMod,
        modlar: URUN_MODLARI,
        refresh,
        secMod,
      }}>
      {children}
    </ModContext.Provider>
  );
}

export function useMod() {
  return useContext(ModContext);
}
