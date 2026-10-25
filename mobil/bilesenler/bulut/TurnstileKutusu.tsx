/**
 * Cloudflare Turnstile — yalnız web (PWA). Native’de gösterilmez.
 */
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { turnstileSiteKey } from '@/kaynak/bulut/otp-koruma';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    },
  ) => string;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __syTurnstileYuklendi?: boolean;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function scriptYukle(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__syTurnstileYuklendi) {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  }
  window.__syTurnstileYuklendi = true;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Turnstile yüklenemedi'));
    document.head.appendChild(s);
  });
}

type Props = {
  onToken: (token: string | null) => void;
};

export function TurnstileKutusu({ onToken }: Props) {
  const siteKey = turnstileSiteKey();
  const kutuRef = useRef<View | null>(null);
  const widgetRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    onTokenRef.current(null);
    if (Platform.OS !== 'web' || !siteKey || typeof document === 'undefined') return;

    let iptal = false;

    void scriptYukle()
      .then(() => {
        if (iptal || !window.turnstile) return;
        const el = kutuRef.current as unknown as HTMLElement | null;
        if (!el) return;
        widgetRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => {
            setHata(null);
            onTokenRef.current(token);
          },
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => {
            setHata('Bot kontrolü yüklenemedi. Sayfayı yenile.');
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        setHata('Bot kontrolü yüklenemedi. İnternet veya reklam engelleyiciyi kontrol et.');
        onTokenRef.current(null);
      });

    return () => {
      iptal = true;
      if (window.turnstile && widgetRef.current) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          /* noop */
        }
      }
      widgetRef.current = null;
    };
  }, [siteKey]);

  if (!siteKey) return null;
  if (Platform.OS !== 'web') {
    return (
      <Text style={s.metin}>E-posta kodu gönderimi için web sürümünü (superkuzu.vercel.app) kullan.</Text>
    );
  }

  return (
    <View style={s.kap}>
      <View ref={kutuRef} collapsable={false} />
      {hata ? <Text style={s.hata}>{hata}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  kap: { marginVertical: 4, minHeight: 68 },
  metin: { fontSize: 13, color: '#6b7280' },
  hata: { fontSize: 13, color: '#b91c1c', marginTop: 4 },
});
