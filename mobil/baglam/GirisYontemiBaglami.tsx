import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getGirisYontemiTercih,
  girisYontemiKurulumTamamla,
  saveGirisYontemiTercih,
  type GirisYontemiTercih,
  type KuzuSecimYontemi,
  type TartimGirisYontemi,
  VARSAYILAN_GIRIS_YONTEMI,
} from '@/kaynak/giris-yontemi';

type GirisYontemiCtx = {
  tercih: GirisYontemiTercih;
  yukleniyor: boolean;
  yenile: () => Promise<void>;
  kaydet: (
    kuzuSecim: KuzuSecimYontemi,
    tartimGiris: TartimGirisYontemi,
    opts?: { kurulumTamam?: boolean },
  ) => Promise<GirisYontemiTercih>;
  kurulumTamamla: (
    kuzuSecim: KuzuSecimYontemi,
    tartimGiris: TartimGirisYontemi,
  ) => Promise<GirisYontemiTercih>;
};

const GirisYontemiContext = createContext<GirisYontemiCtx>({
  tercih: VARSAYILAN_GIRIS_YONTEMI,
  yukleniyor: true,
  yenile: async () => {},
  kaydet: async () => VARSAYILAN_GIRIS_YONTEMI,
  kurulumTamamla: async () => VARSAYILAN_GIRIS_YONTEMI,
});

export function useGirisYontemi() {
  return useContext(GirisYontemiContext);
}

export function GirisYontemiProvider({ children }: { children: React.ReactNode }) {
  const [tercih, setTercih] = useState<GirisYontemiTercih>(VARSAYILAN_GIRIS_YONTEMI);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    try {
      setTercih(await getGirisYontemiTercih());
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const kaydet = useCallback(
    async (
      kuzuSecim: KuzuSecimYontemi,
      tartimGiris: TartimGirisYontemi,
      opts?: { kurulumTamam?: boolean },
    ) => {
      const saved = await saveGirisYontemiTercih({
        kuzuSecim,
        tartimGiris,
        kurulumTamam: opts?.kurulumTamam ?? tercih.kurulumTamam,
      });
      setTercih(saved);
      return saved;
    },
    [tercih.kurulumTamam],
  );

  const kurulumTamamla = useCallback(
    async (kuzuSecim: KuzuSecimYontemi, tartimGiris: TartimGirisYontemi) => {
      const saved = await girisYontemiKurulumTamamla(kuzuSecim, tartimGiris);
      setTercih(saved);
      return saved;
    },
    [],
  );

  const value = useMemo(
    () => ({ tercih, yukleniyor, yenile, kaydet, kurulumTamamla }),
    [tercih, yukleniyor, yenile, kaydet, kurulumTamamla],
  );

  return <GirisYontemiContext.Provider value={value}>{children}</GirisYontemiContext.Provider>;
}
