import { chromium } from 'playwright';

const tercih = JSON.stringify({ kuzuSecim: 'manuel', tartimGiris: 'manuel', kurulumTamam: true, guncelleme: '2026-11-08' });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
await page.addInitScript((v) => localStorage.setItem('sy_giris_yontemi_tercih', v), tercih);
await page.goto('http://127.0.0.1:8085/maliyet/besi-planlama', { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('t364u katalog', { exact: false }).waitFor({ timeout: 60000 });
await page.getByText('Kendi sürü', { exact: false }).first().click();
await page.getByPlaceholder('Ara', { exact: false }).fill('Pırlak');
await page.getByText('Pırlak (Pırıt)', { exact: false }).click();
await page.screenshot({ path: '/opt/cursor/artifacts/besi-planlama-t364u-katalog.png', fullPage: false });
await browser.close();
