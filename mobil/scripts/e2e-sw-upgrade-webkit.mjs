/**
 * WebKit: eski önbellek / sürüm uyumsuzluğu sonrası /bulut — dead-end metin olmamalı.
 * Usage: node mobil/scripts/e2e-sw-upgrade-webkit.mjs [baseUrl]
 */
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'https://superkuzu.vercel.app';

const ua =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const GIRIS_INIT = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

async function metin(page) {
  return page.locator('body').innerText({ timeout: 12000 }).catch(() => '');
}

/** Eski SW: JS bundle önbellek-önce (stale entry) */
async function eskiBundleOnbellek(ctx, base) {
  const kayit = new Map();
  await ctx.route('**/_expo/static/js/**', async (route) => {
    const url = route.request().url();
    if (kayit.has(url)) return route.fulfill(kayit.get(url));
    const r = await ctx.request.get(url);
    const body = await r.body();
    const entry = {
      status: r.status(),
      contentType: r.headers()['content-type'] || 'application/javascript',
      body,
    };
    kayit.set(url, entry);
    return route.fulfill(entry);
  });
  await ctx.route('**/sw.js', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const guncel = await ctx.request.get(`${base}/sw.js?nocache=${Date.now()}`);
    return route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: await guncel.text(),
    });
  });
}

async function main() {
  const browser = await webkit.launch({ headless: true });
  const sonuc = { base: BASE, webkit: {} };

  const kurulumHazir = async (ctx) => {
    await ctx.addInitScript((v) => localStorage.setItem('sy_giris_yontemi_tercih', v), GIRIS_INIT);
  };

  const ctxTaze = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
  await kurulumHazir(ctxTaze);
  const pTaze = await ctxTaze.newPage();
  await pTaze.goto(`${BASE}/bulut`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pTaze.waitForTimeout(4500);
  const tTaze = await metin(pTaze);
  sonuc.webkit.taze_bulut = {
    kapali: /henüz açık değil/.test(tTaze),
    tekrarDene: /Tekrar dene/.test(tTaze),
    giris: /Giriş yap|Kod gönder/.test(tTaze),
    surumJson: (await ctxTaze.request.get(`${BASE}/surum.json?v=${Date.now()}`)).ok(),
  };
  await pTaze.screenshot({ path: '/opt/cursor/artifacts/sw-upgrade-webkit-taze-bulut.png', fullPage: true });

  const surumGovde = sonuc.webkit.taze_bulut.surumJson
    ? await (await ctxTaze.request.get(`${BASE}/surum.json?v=${Date.now()}`)).json()
    : null;
  const ctxEski = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
  await kurulumHazir(ctxEski);
  if (surumGovde?.surum) {
    await ctxEski.addInitScript(
      ([anahtar, eski]) => localStorage.setItem(anahtar, eski),
      ['sy_web_surum_v1', `eski-${surumGovde.surum}`],
    );
  }
  await eskiBundleOnbellek(ctxEski, BASE);
  const pEski = await ctxEski.newPage();
  await pEski.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pEski.waitForTimeout(5000);
  await pEski.goto(`${BASE}/bulut`, { waitUntil: 'domcontentloaded' });
  await pEski.waitForTimeout(5000);
  let tEski = await metin(pEski);
  sonuc.webkit.eski_surum_yolu = {
    kapali: /henüz açık değil/.test(tEski),
    yenileCip: /Yeni sürüm/.test(tEski),
    tekrarDene: /Tekrar dene/.test(tEski),
    giris: /Giriş yap|Kod gönder/.test(tEski),
  };
  if (sonuc.webkit.eski_surum_yolu.yenileCip) {
    const chip = pEski.getByText(/Yeni sürüm/);
    if (await chip.isVisible().catch(() => false)) {
      await chip.click();
      await pEski.waitForTimeout(6000);
      tEski = await metin(pEski);
      sonuc.webkit.eski_surum_yolu.sonraKapali = /henüz açık değil/.test(tEski);
      sonuc.webkit.eski_surum_yolu.sonraGiris = /Giriş yap|Kod gönder/.test(tEski);
    }
  }
  await pEski.screenshot({ path: '/opt/cursor/artifacts/sw-upgrade-webkit-eski-yol.png', fullPage: true });

  console.log(JSON.stringify(sonuc, null, 2));
  await browser.close();

  const ok =
    !sonuc.webkit.taze_bulut.kapali &&
    (sonuc.webkit.taze_bulut.giris || sonuc.webkit.taze_bulut.tekrarDene) &&
    !sonuc.webkit.eski_surum_yolu.kapali &&
    (sonuc.webkit.eski_surum_yolu.giris ||
      sonuc.webkit.eski_surum_yolu.tekrarDene ||
      sonuc.webkit.eski_surum_yolu.yenileCip);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
