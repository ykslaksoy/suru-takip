/** Ayarlar → Veri ve senkron kartı (mobil viewport) */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://superkuzu.vercel.app';
const tercih = JSON.stringify({ kuzuSecim: 'manuel', tartimGiris: 'manuel', kurulumTamam: true });
const ua =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: ua });
await ctx.addInitScript((v) => localStorage.setItem('sy_giris_yontemi_tercih', v), tercih);
const page = await ctx.newPage();
await page.goto(`${BASE}/ayarlar`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(3000);
const t = await page.textContent('body');
const sonuc = {
  veriSenkron: /Veri ve senkron/.test(t ?? ''),
  kapaliEski: /Bulut senkron kapalı — JSON/.test(t ?? ''),
  hazir: /Bulut bağlantısı hazır|Daha → Bulut/.test(t ?? ''),
  bulutLink: /Bulut girişi ve eşitleme/.test(t ?? ''),
};
await page.screenshot({ path: '/opt/cursor/artifacts/ayarlar-t392u-senkron.png', fullPage: true });
console.log(JSON.stringify(sonuc, null, 2));
await browser.close();
process.exit(sonuc.veriSenkron && sonuc.hazir && sonuc.bulutLink && !sonuc.kapaliEski ? 0 : 1);
