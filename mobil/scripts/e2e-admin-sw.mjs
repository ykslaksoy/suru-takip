/**
 * Admin / SW regressions — eski SW simülasyonu + client navigasyon.
 * Usage: node mobil/scripts/e2e-admin-sw.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://superkuzu.vercel.app';

const GIRIS_INIT = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

function expo404(t) {
  return /Sayfa bulunamadı|Bu sayfa mevcut değil/.test(t);
}

/** Eski SW: /admin navigate isteğine Expo kök (/) HTML döner — blob SW kaydı tarayıcıda yasak. */
async function eskiSwSimule(ctx) {
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.origin !== new URL(BASE).origin) return route.continue();
    const admin =
      req.resourceType() === 'document' &&
      (u.pathname === '/admin' || (u.pathname.startsWith('/admin/') && !u.pathname.endsWith('.html')));
    if (admin) {
      const kok = await ctx.request.get(`${BASE}/`);
      return route.fulfill({ status: 200, contentType: 'text/html', body: await kok.text() });
    }
    return route.continue();
  });
}

async function metin(page) {
  return page.locator('body').innerText({ timeout: 8000 }).catch(() => '');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const kurulumHazir = async (ctx) => {
    await ctx.addInitScript((v) => localStorage.setItem('sy_giris_yontemi_tercih', v), GIRIS_INIT);
  };

  const ctxTaze = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
  await kurulumHazir(ctxTaze);
  const page = await ctxTaze.newPage();
  const sonuc = { base: BASE, kontroller: {} };

  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  const t1 = await metin(page);
  sonuc.kontroller.taze_admin = {
    otp: t1.includes('Kod gönder') || t1.includes('SürüYön Admin'),
    expo404: expo404(t1),
  };

  const ctxEski = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
  await kurulumHazir(ctxEski);
  await eskiSwSimule(ctxEski);
  const pageEski = await ctxEski.newPage();
  await pageEski.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  const t2 = await metin(pageEski);
  sonuc.kontroller.eski_sw_tam_sayfa = {
    otp: t2.includes('Kod gönder') || t2.includes('SürüYön Admin'),
    expo404: expo404(t2),
    kopru: t2.includes('Admin paneli aç'),
  };

  const ctxNav = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
  await kurulumHazir(ctxNav);
  await eskiSwSimule(ctxNav);
  const pageNav = await ctxNav.newPage();
  await pageNav.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await pageNav.evaluate(() => {
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await pageNav.waitForTimeout(2500);
  const t3 = await metin(pageNav);
  sonuc.kontroller.uygulama_ici_admin = {
    otp: t3.includes('Kod gönder'),
    expo404: expo404(t3),
    kopru: t3.includes('Admin paneli aç'),
    redirect: pageNav.url().includes('/admin/index.html'),
  };

  const shot = '/opt/cursor/artifacts/admin-t389u-e2e.png';
  await pageNav.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
  sonuc.screenshot = shot;

  console.log(JSON.stringify(sonuc, null, 2));
  await browser.close();
  const fail =
    !sonuc.kontroller.taze_admin.otp ||
    (sonuc.kontroller.eski_sw_tam_sayfa.expo404 && !sonuc.kontroller.eski_sw_tam_sayfa.otp) ||
    (sonuc.kontroller.uygulama_ici_admin.expo404 &&
      !sonuc.kontroller.uygulama_ici_admin.kopru &&
      !sonuc.kontroller.uygulama_ici_admin.otp);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
