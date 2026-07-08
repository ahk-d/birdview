// Product Hunt launch assets (no dev server needed):
//   - ph-logo-512.png       512x512 brand thumbnail (safe for PH's circular mask)
//   - ph-gallery-cover-1270x760.jpg  first gallery slide with mascot
// Run: node scripts/ph-assets.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'store-assets');
mkdirSync(out, { recursive: true });
const mascot = `data:image/webp;base64,${readFileSync(resolve(root, 'docs/mascot.webp')).toString('base64')}`;

const browser = await chromium.launch();

// ── Logo 512 (full-bleed sea-blue so a circular crop still looks intentional) ──
const logo = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
const lp = await logo.newPage();
await lp.setContent(`<!doctype html><html><body style="margin:0">
  <div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(140% 140% at 30% 15%, #38bdf8 0%, #0284c7 52%, #0b4f87 100%);
    font-family:Inter,Arial,sans-serif;color:#fff;font-weight:800;font-size:300px;letter-spacing:-8px">B</div>
</body></html>`);
await lp.waitForTimeout(150);
await lp.screenshot({ path: resolve(out, 'ph-logo-512.png') });
await logo.close();

// ── Gallery cover 1270x760 (PH's recommended gallery size) ──
const cover = await browser.newContext({ viewport: { width: 1270, height: 760 } });
const cp = await cover.newPage();
await cp.setContent(`<!doctype html><html><body style="margin:0">
  <div style="position:relative;overflow:hidden;width:100%;height:100vh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:34px;
    background:radial-gradient(1200px 620px at 72% -10%, #38bdf8 0%, #0284c7 46%, #0b4f87 100%);
    font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;text-align:center">
    <div style="display:flex;align-items:center;gap:24px;z-index:2">
      <div style="width:132px;height:132px;border-radius:32px;background:rgba(255,255,255,.16);
        display:flex;align-items:center;justify-content:center;font-weight:800;font-size:80px;
        border:2px solid rgba(255,255,255,.32)">B</div>
      <div style="font-size:118px;font-weight:800;letter-spacing:-.02em">Birdview</div>
    </div>
    <div style="font-size:34px;font-weight:500;opacity:.96;max-width:64%;z-index:2;line-height:1.35">
      Turn every new tab into a private, local-first productivity dashboard
    </div>
    <div style="font-size:20px;opacity:.8;z-index:2">No login · Works offline · Your data stays yours</div>
    <img src="${mascot}" alt="" style="position:absolute;right:-8px;bottom:-26px;width:300px;
      filter:drop-shadow(0 8px 24px rgba(0,0,0,.28));transform:rotate(4deg);z-index:1"/>
  </div></body></html>`);
await cp.waitForTimeout(200);
await cp.screenshot({ path: resolve(out, 'ph-gallery-cover-1270x760.jpg'), type: 'jpeg', quality: 92 });
await cover.close();

await browser.close();
console.log('PH assets written to', out);
