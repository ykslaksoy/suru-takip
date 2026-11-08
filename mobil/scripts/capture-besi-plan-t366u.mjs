import { chromium } from 'playwright';

const tercih = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

const base = process.env.CAPTURE_BASE ?? 'http://127.0.0.1:8085';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 440, height: 1100 } });
await page.addInitScript((v) => {
  localStorage.setItem('sy_giris_yontemi_tercih', v);
}, tercih);
await page.goto(`${base}/maliyet/besi-planlama`, { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Referans / kullanıcı fiyatları', { exact: false }).waitFor({ timeout: 90000 });
await page.getByText('Giriş kg/baş', { exact: false }).locator('..').locator('input').fill('25');
await page.getByText('Tahmini alış', { exact: false }).locator('..').locator('input').first().fill('500');
await page.screenshot({ path: '/opt/cursor/artifacts/besi-planlama-t366u-referans-override.png', fullPage: false });
await browser.close();
