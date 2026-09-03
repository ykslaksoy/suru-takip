import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { kaydetAyarlarAc } from '@/kaynak/navigasyon/ayarlar';

type AyarlarCtx = {
  acik: boolean;
  ac: () => void;
  kapat: () => void;
};

const AyarlarContext = createContext<AyarlarCtx>({
  acik: false,
  ac: () => {},
  kapat: () => {},
});

export function useAyarlar() {
  return useContext(AyarlarContext);
}

export function AyarlarProvider({ children }: { children: React.ReactNode }) {
  const [acik, setAcik] = useState(false);
  const ac = useCallback(() => setAcik(true), []);
  const kapat = useCallback(() => setAcik(false), []);

  useLayoutEffect(() => {
    kaydetAyarlarAc(ac);
    return () => kaydetAyarlarAc(null);
  }, [ac]);

  const value = useMemo(() => ({ acik, ac, kapat }), [acik, ac, kapat]);

  return <AyarlarContext.Provider value={value}>{children}</AyarlarContext.Provider>;
}
