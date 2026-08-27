import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAnaSayfaTercih,
  menuOgesiCoz,
  resetAnaSayfaTercih,
  saveAnaSayfaTercih,
  MENU_KATALOGU,
  VARSAYILAN_ANA_SAYFA,
  type AnaSayfaTercih,
  type MenuOgesi,
} from '@/kaynak/ana-sayfa';

interface AnaSayfaContextValue {
  loading: boolean;
  tercih: AnaSayfaTercih;
  hizliIslemler: MenuOgesi[];
  kestirmeler: MenuOgesi[];
  katalog: MenuOgesi[];
  refresh: () => Promise<void>;
  saveTercih: (tercih: AnaSayfaTercih) => Promise<void>;
  resetTercih: () => Promise<void>;
}

const AnaSayfaContext = createContext<AnaSayfaContextValue>({
  loading: true,
  tercih: { hizliIslemIds: [], kestirmeIds: [] },
  hizliIslemler: [],
  kestirmeler: [],
  katalog: MENU_KATALOGU,
  refresh: async () => {},
  saveTercih: async () => {},
  resetTercih: async () => {},
});

export function AnaSayfaProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [tercih, setTercih] = useState<AnaSayfaTercih>(VARSAYILAN_ANA_SAYFA);

  const refresh = useCallback(async () => {
    const next = await getAnaSayfaTercih();
    setTercih(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveTercih = useCallback(
    async (next: AnaSayfaTercih) => {
      const saved = await saveAnaSayfaTercih(next);
      setTercih(saved);
    },
    []
  );

  const resetTercih = useCallback(async () => {
    const next = await resetAnaSayfaTercih();
    setTercih(next);
  }, []);

  const hizliIslemler = useMemo(() => menuOgesiCoz(tercih.hizliIslemIds), [tercih.hizliIslemIds]);
  const kestirmeler = useMemo(() => menuOgesiCoz(tercih.kestirmeIds), [tercih.kestirmeIds]);

  return (
    <AnaSayfaContext.Provider
      value={{
        loading,
        tercih,
        hizliIslemler,
        kestirmeler,
        katalog: MENU_KATALOGU,
        refresh,
        saveTercih,
        resetTercih,
      }}>
      {children}
    </AnaSayfaContext.Provider>
  );
}

export function useAnaSayfa() {
  return useContext(AnaSayfaContext);
}
