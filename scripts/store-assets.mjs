// Generates Chrome Web Store graphic assets as JPEG (no alpha channel):
//   - 5 screenshots at 1280x800
//   - small promo tile 440x280
//   - marquee promo tile 1400x560
// Requires the dev server running (default http://localhost:5182).
// Run: node scripts/store-assets.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:5182';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../store-assets');
mkdirSync(out, { recursive: true });

const shot = (page, name) =>
  page.screenshot({ path: resolve(out, name), type: 'jpeg', quality: 92 });
const wait = (page, ms) => page.waitForTimeout(ms);

const browser = await chromium.launch();

// ── Screenshots (1280x800) ─────────────────────────────────────────────────
const light = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
const page = await light.newPage();
await page.goto(BASE);
await wait(page, 2500);
await shot(page, '01-dashboard.jpg');

// Search + command palette
await page.keyboard.press('Control+k');
await wait(page, 500);
await page.keyboard.type('design');
await wait(page, 700);
await shot(page, '03-search.jpg');
await page.keyboard.press('Escape');
await wait(page, 300);

// Quick capture
await page.keyboard.press('c');
await wait(page, 600);
await shot(page, '04-quick-capture.jpg');
await page.keyboard.press('Escape');
await wait(page, 300);

// Kanban board
try {
  await page.getByLabel('Open board').click({ timeout: 3000 });
  await wait(page, 800);
  await shot(page, '05-kanban.jpg');
  await page.keyboard.press('Escape');
} catch {
  console.warn('Kanban button not found — skipping 05');
}
await light.close();

// Dark dashboard
const dark = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
const dpage = await dark.newPage();
await dpage.goto(BASE);
await wait(dpage, 2500);
await shot(dpage, '02-dashboard-dark.jpg');
await dark.close();

// ── Promo tiles ─────────────────────────────────────────────────────────────
function promoHTML(big) {
  const titleSize = big ? 120 : 52;
  const tagSize = big ? 34 : 17;
  const iconSize = big ? 150 : 64;
  const radius = big ? 36 : 16;
  return `<!doctype html><html><body style="margin:0">
  <div style="width:100%;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${big ? 28 : 12}px;
    background:radial-gradient(1200px 600px at 75% -10%, #38bdf8 0%, #0284c7 45%, #0b4f87 100%);
    font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;text-align:center">
    <div style="display:flex;align-items:center;gap:${big ? 24 : 12}px">
      <div style="width:${iconSize}px;height:${iconSize}px;border-radius:${radius}px;background:rgba(255,255,255,.16);
        display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${iconSize * 0.6}px;border:2px solid rgba(255,255,255,.3)">B</div>
      <div style="font-size:${titleSize}px;font-weight:800;letter-spacing:-.02em">Birdview</div>
    </div>
    <div style="font-size:${tagSize}px;font-weight:500;opacity:.95;max-width:80%">
      Your private, local-first productivity home — right in your new tab
    </div>
  </div></body></html>`;
}

const promo = await browser.newContext({ viewport: { width: 440, height: 280 } });
const ppage = await promo.newPage();
await ppage.setContent(promoHTML(false));
await wait(ppage, 200);
await shot(ppage, 'promo-small-440x280.jpg');
await ppage.setViewportSize({ width: 1400, height: 560 });
await ppage.setContent(promoHTML(true));
await wait(ppage, 200);
await shot(ppage, 'promo-marquee-1400x560.jpg');
await promo.close();

await browser.close();
console.log('Store assets written to', out);
