// Generates Birdview's PNG icons (16/32/48/128) without external deps — a rounded sea-blue tile
// with a white "B" glyph. Run: `node scripts/make-icons.mjs`.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(dir, { recursive: true });

const BG = [2, 132, 199]; // sea blue — sky-600
const FG = [255, 255, 255];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const radius = size * 0.22;
  // Build RGBA pixel buffer with scanline filter bytes.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const inRoundedRect = (x, y) => {
    const r = radius;
    const cx = Math.min(Math.max(x, r), size - r);
    const cy = Math.min(Math.max(y, r), size - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= r && x <= size - r) || (y >= r && y <= size - r);
  };
  // Simple block "B" geometry.
  const s = size;
  const bLeft = s * 0.34;
  const bRight = s * 0.66;
  const bTop = s * 0.28;
  const bBottom = s * 0.72;
  const bMid = s * 0.5;
  const stroke = s * 0.1;
  const isGlyph = (x, y) => {
    if (x >= bLeft && x <= bLeft + stroke && y >= bTop && y <= bBottom) return true; // left spine
    if (y >= bTop && y <= bTop + stroke && x >= bLeft && x <= bRight) return true; // top bar
    if (y >= bMid - stroke / 2 && y <= bMid + stroke / 2 && x >= bLeft && x <= bRight) return true; // mid bar
    if (y >= bBottom - stroke && y <= bBottom && x >= bLeft && x <= bRight) return true; // bottom bar
    if (x >= bRight - stroke && x <= bRight && y >= bTop && y <= bMid) return true; // upper bowl edge
    if (x >= bRight - stroke && x <= bRight && y >= bMid && y <= bBottom) return true; // lower bowl edge
    return false;
  };

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * 4;
      const inside = inRoundedRect(x + 0.5, y + 0.5);
      if (!inside) {
        raw[i] = 0;
        raw[i + 1] = 0;
        raw[i + 2] = 0;
        raw[i + 3] = 0;
      } else {
        const [r, g, b] = isGlyph(x, y) ? FG : BG;
        raw[i] = r;
        raw[i + 1] = g;
        raw[i + 2] = b;
        raw[i + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(resolve(dir, `icon${size}.png`), png(size));
}

// Minimal SVG favicon for the dev web build — sea-blue tile with a white "B".
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="rgb(2,132,199)"/><text x="64" y="92" font-family="Inter,Arial,sans-serif" font-size="84" font-weight="700" text-anchor="middle" fill="#fff">B</text></svg>`;
writeFileSync(resolve(dir, 'icon.svg'), svg);

console.log('Generated icons in', dir);
