// Generates Chrome Web Store graphic assets as JPEG (no alpha channel):
//   - 5 screenshots at 1280x800   (skipped when PROMO_ONLY=1)
//   - small promo tile 440x280    (with mascot)
//   - marquee promo tile 1400x560 (with mascot)
// Screenshots require the dev server running (default http://localhost:5182).
// Run: node scripts/store-assets.mjs           (everything)
//      PROMO_ONLY=1 node scripts/store-assets.mjs   (just the promo tiles, no server needed)
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL ?? 'http://localhost:5182';
const PROMO_ONLY = process.env.PROMO_ONLY === '1';
const out = resolve(root, 'store-assets');
mkdirSync(out, { recursive: true });

// Inline the mascot as a data URI so the promo HTML is fully self-contained.
const mascot = `data:image/webp;base64,${readFileSync(resolve(root, 'docs/mascot.webp')).toString('base64')}`;

const shot = (page, name) =>
  page.screenshot({ path: resolve(out, name), type: 'jpeg', quality: 92 });
const wait = (page, ms) => page.waitForTimeout(ms);

const browser = await chromium.launch();

// ── Screenshots (1280x800) ─────────────────────────────────────────────────
if (!PROMO_ONLY) {
  const light = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
  const page = await light.newPage();
  await page.goto(BASE);
  await wait(page, 2500);
  await shot(page, '01-dashboard.jpg');

  await page.keyboard.press('Control+k');
  await wait(page, 500);
  await page.keyboard.type('design');
  await wait(page, 700);
  await shot(page, '03-search.jpg');
  await page.keyboard.press('Escape');
  await wait(page, 300);

  await page.keyboard.press('c');
  await wait(page, 600);
  await shot(page, '04-quick-capture.jpg');
  await page.keyboard.press('Escape');
  await wait(page, 300);

  try {
    await page.getByLabel('Open board').click({ timeout: 3000 });
    await wait(page, 800);
    await shot(page, '05-kanban.jpg');
    await page.keyboard.press('Escape');
  } catch {
    console.warn('Kanban button not found — skipping 05');
  }
  await light.close();

  const dark = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const dpage = await dark.newPage();
  await dpage.goto(BASE);
  await wait(dpage, 2500);
  await shot(dpage, '02-dashboard-dark.jpg');
  await dark.close();
}

// ── Promo tiles (with mascot) ─────────────────────────────────────────────────
function promoHTML(big) {
  const titleSize = big ? 116 : 50;
  const tagSize = big ? 32 : 16;
  const iconSize = big ? 132 : 58;
  const radius = big ? 32 : 14;
  const catSize = big ? 300 : 128;
  return `<!doctype html><html><body style="margin:0">
  <div style="position:relative;overflow:hidden;width:100%;height:100vh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:${big ? 26 : 11}px;
    background:radial-gradient(1200px 600px at 72% -10%, #38bdf8 0%, #0284c7 46%, #0b4f87 100%);
    font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;text-align:center">
    <div style="display:flex;align-items:center;gap:${big ? 22 : 11}px;z-index:2">
      <div style="width:${iconSize}px;height:${iconSize}px;border-radius:${radius}px;background:rgba(255,255,255,.16);
        display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${iconSize * 0.6}px;
        border:2px solid rgba(255,255,255,.32)">B</div>
      <div style="font-size:${titleSize}px;font-weight:800;letter-spacing:-.02em">Birdview</div>
    </div>
    <div style="font-size:${tagSize}px;font-weight:500;opacity:.95;max-width:${big ? 60 : 78}%;z-index:2">
      Your private, local-first productivity home — right in your new tab
    </div>
    <img src="${mascot}" alt="" style="position:absolute;right:${big ? -10 : -6}px;bottom:${big ? -24 : -14}px;
      width:${catSize}px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.28));transform:rotate(4deg);z-index:1"/>
  </div></body></html>`;
}

const promo = await browser.newContext({ viewport: { width: 440, height: 280 } });
const ppage = await promo.newPage();
await ppage.setContent(promoHTML(false));
await wait(ppage, 250);
await shot(ppage, 'promo-small-440x280.jpg');
await ppage.setViewportSize({ width: 1400, height: 560 });
await ppage.setContent(promoHTML(true));
await wait(ppage, 250);
await shot(ppage, 'promo-marquee-1400x560.jpg');
await promo.close();

await browser.close();
console.log('Store assets written to', out, PROMO_ONLY ? '(promo only)' : '');
