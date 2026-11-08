/** Web: service worker kaydı + online/offline dinleme */
import { baglantiGuncelle } from './durum';

let bekleyen: ServiceWorker | null = null;
let kuruldu = false;

export function cevrimdisiKur(): void {
  if (kuruldu || typeof window === 'undefined') return;
  kuruldu = true;
  baglantiGuncelle({ cevrimici: navigator.onLine !== false });
  window.addEventListener('online', () => baglantiGuncelle({ cevrimici: true }));
  window.addEventListener('offline', () => baglantiGuncelle({ cevrimici: false }));

  if (!('serviceWorker' in navigator) || (typeof __DEV__ !== 'undefined' && __DEV__)) return;
  const kaydet = () =>
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (reg.active) baglantiGuncelle({ hazir: true });
        void reg.update().catch(() => undefined);
        const izle = (w: ServiceWorker | null) => {
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              bekleyen = w;
              baglantiGuncelle({ guncellemeVar: true });
            }
            if (w.state === 'activated') baglantiGuncelle({ hazir: true });
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          bekleyen = reg.waiting;
          baglantiGuncelle({ guncellemeVar: true });
        }
        izle(reg.installing);
        reg.addEventListener('updatefound', () => izle(reg.installing));
        const kontrol = () => void reg.update().catch(() => undefined);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') kontrol();
        });
        window.addEventListener('pageshow', kontrol);
        setInterval(kontrol, 60 * 60 * 1000);
      })
      .catch(() => undefined);
  if (document.readyState === 'complete') kaydet();
  else window.addEventListener('load', kaydet, { once: true });

  let yenilendi = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (yenilendi || !bekleyen) return;
    yenilendi = true;
    window.location.reload();
  });
}

/** "Yenile": bekleyen sürümü devreye al */
export function guncellemeyiUygula(): void {
  if (bekleyen) bekleyen.postMessage('SKIP_WAITING');
  else if (typeof window !== 'undefined') window.location.reload();
}
