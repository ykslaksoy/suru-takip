import { chromium } from 'playwright';

const tercih = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 440, height: 1400 } });
await page.addInitScript((v) => {
  localStorage.setItem('sy_giris_yontemi_tercih', v);
}, tercih);
await page.goto('http://127.0.0.1:8085/maliyet/besi-planlama', { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Hedef kuzu — köken ve ırk', { exact: false }).waitFor({ timeout: 90000 });
await page.locator('input').nth(1).fill('25');
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 1100));
await page.waitForTimeout(500);
await page.screenshot({ path: '/opt/cursor/artifacts/besi-planlama-t359u-karar.png', fullPage: true });
await browser.close();
