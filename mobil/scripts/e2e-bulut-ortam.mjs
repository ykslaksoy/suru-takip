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
  const entry = [...document.scripts].map((s) => s.src).find((u) => u.includes('entry-')) ?? '';
  let bulutAcik = false;
  let refVar = false;
  if (entry) {
    const js = await fetch(entry).then((x) => x.text());
    refVar = js.includes('eferktaopilgoeetgggk');
    bulutAcik = refVar && js.includes('.supabase.co');
  }
  return { hasRoutes, refVar, bulutAcikBundle: bulutAcik };
});
console.log(JSON.stringify({ base: BASE, ...sonuc }, null, 2));
await browser.close();
process.exit(sonuc.bulutAcikBundle ? 0 : 1);
