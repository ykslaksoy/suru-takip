import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:19006';
const OUT = '/opt/cursor/artifacts';

const kurulum = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'baskul',
  kurulumTamam: true,
  guncelleme: new Date().toISOString(),
});

const viewports = [
  { w: 375, tartim: 'manuel', name: 'hizli-tartim-375px-baslangic' },
  { w: 390, tartim: 'manuel', name: 'hizli-tartim-390px-yontem' },
  { w: 430, tartim: 'baskul-ocr', name: 'hizli-tartim-430px-chips' },
  { w: 473, tartim: 'baskul', name: 'hizli-tartim-473px-baskul' },
];

const browser = await chromium.launch();

for (const { w, tartim, name } of viewports) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  const yontem = JSON.stringify({ kuzu: 'manuel', tartim });
  await page.addInitScript(
    ({ g, y }) => {
      localStorage.setItem('sy_giris_yontemi_tercih', g);
      localStorage.setItem('sy_hizli_tartim_yontem_v1', y);
    },
    { g: kurulum, y: yontem },
  );
  await page.goto(`${BASE}/seri-giris`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  if (w === 375) {
    const input = page.getByPlaceholder('Küpe, sırt no veya GEKİS');
    if (await input.isVisible().catch(() => false)) {
      await input.fill('001');
      await page.getByText('Ara ve eşleştir').click();
      await page.waitForTimeout(1200);
      await page.getByText('Bu kuzuyu onayla').click().catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/hizli-tartim-375px-onayli-kilo.png`, fullPage: true });
    }
  }
  if (w === 390) {
    await page.getByText('Yöntemi değiştir').click().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/hizli-tartim-390px-yontem-duzenle.png`, fullPage: true });
  }
  await page.close();
}

await browser.close();
console.log('screenshots ok');
