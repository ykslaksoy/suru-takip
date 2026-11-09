/** Web: service worker kaydı + online/offline dinleme */
import { baglantiGuncelle } from './durum';
import {
  sunucuWebSurumu,
  webSurumGuncelMi,
  yerelWebSurumuKaydet,
} from './surum-kontrol';

let bekleyen: ServiceWorker | null = null;
let kuruldu = false;
let yenilendi = false;

async function surumBildir(reg: ServiceWorkerRegistration): Promise<void> {
  const guncel = await webSurumGuncelMi();
  if (guncel) {
    const sunucu = await sunucuWebSurumu();
    if (sunucu) yerelWebSurumuKaydet(sunucu);
    return;
  }
  baglantiGuncelle({ guncellemeVar: true });
  void reg.update().catch(() => undefined);
  if (reg.waiting) {
    bekleyen = reg.waiting;
    reg.waiting.postMessage('SKIP_WAITING');
  }
}

export function cevrimdisiKur(): void {
  if (kuruldu || typeof window === 'undefined') return;
  kuruldu = true;
  baglantiGuncelle({ cevrimici: navigator.onLine !== false });
  window.addEventListener('online', () => baglantiGuncelle({ cevrimici: true }));
  window.addEventListener('offline', () => baglantiGuncelle({ cevrimici: false }));

  if (!('serviceWorker' in navigator) || (typeof __DEV__ !== 'undefined' && __DEV__)) {
    void (async () => {
      const guncel = await webSurumGuncelMi();
      if (!guncel) baglantiGuncelle({ guncellemeVar: true });
      else {
        const sunucu = await sunucuWebSurumu();
        if (sunucu) yerelWebSurumuKaydet(sunucu);
      }
    })();
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (yenilendi) return;
    yenilendi = true;
    window.location.reload();
  });

  const kaydet = () =>
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        if (reg.active) baglantiGuncelle({ hazir: true });
        void reg.update().catch(() => undefined);
        void surumBildir(reg);
        const izle = (w: ServiceWorker | null) => {
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              bekleyen = w;
              baglantiGuncelle({ guncellemeVar: true });
              w.postMessage('SKIP_WAITING');
            }
            if (w.state === 'activated') baglantiGuncelle({ hazir: true });
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          bekleyen = reg.waiting;
          baglantiGuncelle({ guncellemeVar: true });
          reg.waiting.postMessage('SKIP_WAITING');
        }
        izle(reg.installing);
        reg.addEventListener('updatefound', () => izle(reg.installing));
        const kontrol = () => {
          void reg.update().catch(() => undefined);
          void surumBildir(reg);
        };
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') kontrol();
        });
        window.addEventListener('pageshow', kontrol);
        setInterval(kontrol, 60 * 60 * 1000);
      })
      .catch(() => undefined);
  if (document.readyState === 'complete') kaydet();
  else window.addEventListener('load', kaydet, { once: true });
}

/** "Yenile": bekleyen sürümü devreye al (IndexedDB / localStorage korunur) */
export function guncellemeyiUygula(): void {
  if (bekleyen) bekleyen.postMessage('SKIP_WAITING');
  else if (typeof window !== 'undefined') window.location.reload();
}
