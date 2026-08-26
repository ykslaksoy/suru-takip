import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getPendingSyncCount } from '@/kaynak/cekirdek/veritabani';
import { seedDemoDataIfEmpty } from '@/kaynak/cekirdek/ornek-veri';

interface DatabaseContextValue {
  ready: boolean;
  refreshKey: number;
  pendingSync: number;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  ready: false,
  refreshKey: 0,
  pendingSync: 0,
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    (async () => {
      await seedDemoDataIfEmpty();
      const count = await getPendingSyncCount();
      setPendingSync(count);
      setReady(true);
    })();
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <DatabaseContext.Provider value={{ ready, refreshKey, pendingSync, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
