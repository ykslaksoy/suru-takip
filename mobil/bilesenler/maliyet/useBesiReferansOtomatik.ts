import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { besiReferansOtomatikSenkron } from '@/kaynak/maliyet/besi-referans-otomatik';
import { referansSyncMetaOku, type ReferansSyncMeta } from '@/kaynak/maliyet/besi-referans-sync-meta';

export function useBesiReferansOtomatik(opts?: { acilis?: boolean }) {
  const [meta, setMeta] = useState<ReferansSyncMeta>(() => referansSyncMetaOku());
  const [sonDurum, setSonDurum] = useState<string | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const senkron = useCallback(async (neden: 'acilis' | 'resume' | 'manuel', force = false) => {
    const s = await besiReferansOtomatikSenkron({ neden, force });
    setMeta(s.meta);
    setSonDurum(s.atlandi ? s.kaynakDurum : s.kaynakDurum);
    return s;
  }, []);

  useEffect(() => {
    if (opts?.acilis !== false) void senkron('acilis');
  }, [opts?.acilis, senkron]);

  useFocusEffect(
    useCallback(() => {
      void senkron('resume');
    }, [senkron]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s !== 'active') return;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => void senkron('resume'), 800);
    });
    return () => {
      sub.remove();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [senkron]);

  const manuelYenile = useCallback(() => senkron('manuel', true), [senkron]);

  return { meta, sonDurum, manuelYenile };
}
