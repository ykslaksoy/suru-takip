import { chromium } from 'playwright';

const tercih = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

const base = process.env.CAPTURE_BASE ?? 'http://127.0.0.1:8085';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
await page.addInitScript((v) => {
  localStorage.setItem('sy_giris_yontemi_tercih', v);
}, tercih);
await page.goto(`${base}/akilli-ciftlik`, { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Öğretici simülasyon', { exact: false }).waitFor({ timeout: 60000 });
await page.screenshot({ path: '/opt/cursor/artifacts/akilli-ciftlik-t378u-giris.png', fullPage: true });
await browser.close();
