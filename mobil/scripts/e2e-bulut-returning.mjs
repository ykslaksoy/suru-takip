/**
 * Dönen istemci: doğrudan /bulut (yarış + SW önbellek) — giriş formu veya geçerli yeniden dene.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://superkuzu.vercel.app';

async function eskiOrtamOnbellek(ctx) {
  let onbellek404 = true;
  await ctx.route('**/bulut-ortam.json*', async (route) => {
    if (onbellek404) {
      onbellek404 = false;
      return route.fulfill({ status: 404, body: '{}' });
    }
    return route.continue();
  });
}

const ua =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch({ headless: true });
const sonuc = { base: BASE, senaryolar: {} };

const ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
const p1 = await ctx1.newPage();
await p1.goto(`${BASE}/bulut`, { waitUntil: 'domcontentloaded' });
await p1.waitForTimeout(4000);
const t1 = await p1.textContent('body');
sonuc.senaryolar.direkt_bulut = {
  giris: /Giriş yap|Kod gönder/.test(t1 ?? ''),
  kapali: /henüz açık değil/.test(t1 ?? ''),
  yukleniyor: /yükleniyor/.test(t1 ?? ''),
  tekrarDene: /Tekrar dene/.test(t1 ?? ''),
};
await p1.screenshot({ path: '/opt/cursor/artifacts/bulut-t391u-returning-direkt.png', fullPage: true });

const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
await eskiOrtamOnbellek(ctx2);
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/bulut`, { waitUntil: 'networkidle', timeout: 90000 });
await p2.waitForTimeout(2500);
let t2 = await p2.textContent('body');
sonuc.senaryolar.ilk_404 = { kapali: /henüz açık değil|hazır değil/.test(t2 ?? ''), tekrarDene: /Tekrar dene/.test(t2 ?? '') };
if (sonuc.senaryolar.ilk_404.tekrarDene) {
  await p2.getByText('Tekrar dene', { exact: true }).click();
  await p2.waitForTimeout(3500);
  t2 = await p2.textContent('body');
}
sonuc.senaryolar.ilk_404.girisSonra = /Giriş yap|Kod gönder/.test(t2 ?? '');
await p2.screenshot({ path: '/opt/cursor/artifacts/bulut-t391u-returning-retry.png', fullPage: true });

console.log(JSON.stringify(sonuc, null, 2));
await browser.close();

const ok =
  sonuc.senaryolar.direkt_bulut.giris &&
  !sonuc.senaryolar.direkt_bulut.kapali &&
  sonuc.senaryolar.ilk_404.tekrarDene &&
  sonuc.senaryolar.ilk_404.girisSonra;
process.exit(ok ? 0 : 1);
