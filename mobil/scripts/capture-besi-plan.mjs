import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8085/maliyet/besi-planlama';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 1000 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.getByText('Giriş kg/baş', { exact: false }).waitFor({ timeout: 60000 });
await page.locator('input').nth(1).fill('25');
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: '/opt/cursor/artifacts/besi-planlama-t356u.png', fullPage: true });
await browser.close();
