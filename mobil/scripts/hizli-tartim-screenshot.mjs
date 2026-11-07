import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:19006';
const OUT = '/opt/cursor/artifacts';

const viewports = [
  { w: 390, name: 'hizli-tartim-390px' },
  { w: 430, name: 'hizli-tartim-430px' },
  { w: 473, name: 'hizli-tartim-473px' },
];

const browser = await chromium.launch();
const kurulum = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: new Date().toISOString(),
});

for (const { w, name } of viewports) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.addInitScript((v) => {
    localStorage.setItem('sy_giris_yontemi_tercih', v);
  }, kurulum);
  await page.goto(`${BASE}/seri-giris`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log('screenshots ok');
