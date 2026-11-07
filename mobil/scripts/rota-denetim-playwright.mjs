/**
 * Yerel Expo web — menü rotaları HTTP smoke (veri yazmaz).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.EXPO_WEB_URL ?? 'http://127.0.0.1:19006';
const OUT = '/opt/cursor/artifacts';

const kurulum = JSON.stringify({
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: true,
  guncelleme: new Date().toISOString(),
});

const rotalar = [
  '/',
  '/suru',
  '/stok',
  '/akilli-kuzu',
  '/daha',
  '/seri-giris',
  '/gorevler',
  '/takvim',
  '/excel',
  '/ses',
  '/bulut',
  '/gecmis?sekme=cop',
  '/gecmis?sekme=kayit',
  '/saglik',
  '/rasyon',
  '/veteriner',
  '/yolculuk',
  '/hayvan/hizli-ekle',
  '/giris-yontemi',
  '/sistem-kontrol',
];

mkdirSync(OUT, { recursive: true });
const rapor = [];
const browser = await chromium.launch();

for (const w of [375, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.addInitScript((g) => localStorage.setItem('sy_giris_yontemi_tercih', g), kurulum);
  for (const rota of rotalar) {
    const url = `${BASE}${rota}`;
    let status = 'hata';
    let not = '';
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(500);
      const body = await page.locator('body').innerText();
      const kod = resp?.status() ?? 0;
      const hataMetni = /Unmatched Route|doesn't exist/i.test(body);
      status = kod >= 200 && kod < 400 && !hataMetni && body.length > 80 ? 'ok' : 'uyari';
      not = hataMetni ? 'Eşleşmeyen rota' : `HTTP ${kod}, ${body.length} char`;
    } catch (e) {
      not = e instanceof Error ? e.message.slice(0, 120) : String(e);
    }
    rapor.push({ genislik: w, rota, status, not });
  }
  await page.close();
}

await browser.close();
writeFileSync(`${OUT}/rota-denetim-rapor.json`, JSON.stringify({ zaman: new Date().toISOString(), base: BASE, rapor }, null, 2));
const fail = rapor.filter((x) => x.status !== 'ok');
console.log(`rota-denetim: ${rapor.length - fail.length}/${rapor.length} ok`);
