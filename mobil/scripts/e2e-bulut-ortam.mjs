/**
 * Üretim bundle: bulut yapılandırması tarayıcıda okunuyor mu (anon key değeri loglanmaz).
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://superkuzu.vercel.app';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
const sonuc = await page.evaluate(async () => {
  const r = await fetch('/_expo/.routes.json');
  const hasRoutes = r.ok;
  const ortam = await fetch('/bulut-ortam.json', { cache: 'no-store' });
  let bulutOrtam = false;
  let refVar = false;
  if (ortam.ok) {
    const j = await ortam.json();
    refVar = String(j.url ?? '').includes('eferktaopilgoeetgggk');
    bulutOrtam = refVar && !!j.anonKey;
  }
  return { hasRoutes, refVar, bulutOrtamDosyasi: bulutOrtam };
});
console.log(JSON.stringify({ base: BASE, ...sonuc }, null, 2));
await browser.close();
process.exit(sonuc.bulutOrtamDosyasi ? 0 : 1);
