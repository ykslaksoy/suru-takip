/* SüperKuzu service worker — uygulama kabuğunu ve dosyaları önbelleğe alır; internet yokken açılır. */
/* global self, caches, fetch, Response, URL */
const AYAR = self.__SW_AYAR__ || { surum: 'dev', dosyalar: ['/'], yonlendirmeler: [] };
const ON_EK = 'superkuzu-';
const ONBELLEK = ON_EK + AYAR.surum;
const AG_BEKLEME_MS = 4000;
const VAR = new Set(AYAR.dosyalar);

function yol(url) {
  let p = url.pathname.replace(/\/+$/, '') || '/';
  if (p.endsWith('.html')) p = p.slice(0, -5) || '/';
  if (p === '/index') p = '/';
  if (VAR.has(p)) return p;
  for (const [kaynak, hedef] of AYAR.yonlendirmeler) {
    const m = p.match(new RegExp(kaynak));
    if (m) return hedef;
  }
  return p;
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(ONBELLEK);
      const l = AYAR.dosyalar;
      for (let i = 0; i < l.length; i += 12) {
        await Promise.all(
          l.slice(i, i + 12).map((u) =>
            fetch(u, { cache: 'reload' })
              .then((r) => (r.ok ? c.put(u, r) : undefined))
              .catch(() => undefined),
          ),
        );
      }
      // İlk kurulumda hemen devral; güncellemede kullanıcı "Yenile"ye basınca
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith(ON_EK) && k !== ONBELLEK) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'SURUM' && e.source) e.source.postMessage({ tur: 'surum', surum: AYAR.surum, dosya: AYAR.dosyalar.length });
});

function zamanAsimi(ms) {
  return new Promise((_, red) => setTimeout(() => red(new Error('zaman aşımı')), ms));
}

async function sayfa(req) {
  const url = new URL(req.url);
  const anahtar = yol(url);
  const c = await caches.open(ONBELLEK);
  try {
    const r = await Promise.race([fetch(req), zamanAsimi(AG_BEKLEME_MS)]);
    if (r && r.ok && r.type === 'basic') c.put(anahtar, r.clone());
    if (r && (r.ok || r.status === 404)) return r;
    throw new Error('ağ hatası');
  } catch {
    const kayitli = (await c.match(anahtar)) || (await c.match('/'));
    if (kayitli) return kayitli;
    return new Response('<!doctype html><meta charset="utf-8"><title>SüperKuzu</title><body style="font-family:sans-serif;padding:24px">İnternet yok ve bu sayfa daha önce açılmamış. İnternet gelince bir kez açın; sonra çevrimdışı da çalışır.</body>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function dosya(req) {
  const c = await caches.open(ONBELLEK);
  const kayitli = await c.match(req, { ignoreSearch: true });
  if (kayitli) return kayitli;
  const r = await fetch(req);
  if (r.ok && r.type === 'basic') c.put(req, r.clone());
  return r;
}

async function agOnce(req) {
  const c = await caches.open(ONBELLEK);
  try {
    const r = await fetch(req);
    if (r.ok && r.type === 'basic') c.put(req, r.clone());
    return r;
  } catch (e) {
    const kayitli = await c.match(req);
    if (kayitli) return kayitli;
    throw e;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // dış servisler: dokunma
  if (url.pathname.startsWith('/_vercel') || url.pathname === '/sw.js') return;
  if (req.mode === 'navigate') {
    e.respondWith(sayfa(req));
    return;
  }
  if (url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/ikon/') || url.pathname === '/favicon.ico') {
    e.respondWith(dosya(req));
    return;
  }
  e.respondWith(agOnce(req));
});
