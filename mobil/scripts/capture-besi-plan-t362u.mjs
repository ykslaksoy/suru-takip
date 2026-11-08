import { chromium } from 'playwright';

const tercih = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: '2026-11-08',
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
await page.addInitScript((v) => {
  localStorage.setItem('sy_giris_yontemi_tercih', v);
}, tercih);
await page.goto('http://127.0.0.1:8085/maliyet/besi-planlama', { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('İşletme bölgesi', { exact: false }).waitFor({ timeout: 90000 });
await page.getByText('Giriş kg/baş', { exact: false }).locator('..').locator('input').fill('25');
await page.getByText('Pazardan toplama', { exact: true }).first().click();
await page.getByText('Irk bilinmiyor', { exact: true }).first().click();
await page.getByPlaceholder('ör. Balıkesir', { exact: false }).fill('Balıkesir');
await page.getByText('Balıkesir canlı', { exact: false }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/opt/cursor/artifacts/besi-planlama-t362u-bolge-irk.png', fullPage: false });
await browser.close();
