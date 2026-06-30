// Package a built extension folder into a store-ready zip. Run after `pnpm build`.
// Usage: node scripts/zip.mjs [distDir] [outName]
import { createWriteStream, existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { deflateRawSync } from 'node:zlib';

// node:zlib.crc32 only exists in Node 24+, so compute it ourselves for broad compatibility.
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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, process.argv[2] ?? 'dist');
const outName = process.argv[3] ?? 'birdview.zip';

if (!existsSync(distDir)) {
  console.error(`Build folder not found: ${distDir}. Run "pnpm build" first.`);
  process.exit(1);
}

// Minimal store-zip writer (no external deps).
function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push({ full, rel: relative(base, full).split('\\').join('/') });
  }
  return out;
}

const files = walk(distDir);
const central = [];
const chunks = [];
let offset = 0;

for (const f of files) {
  const data = readFileSync(f.full);
  const comp = deflateRawSync(data);
  const crc = crc32(data) >>> 0;
  const nameBuf = Buffer.from(f.rel, 'utf8');

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comp.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  chunks.push(local, nameBuf, comp);

  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0);
  cen.writeUInt16LE(20, 4);
  cen.writeUInt16LE(20, 6);
  cen.writeUInt16LE(8, 10);
  cen.writeUInt32LE(crc, 16);
  cen.writeUInt32LE(comp.length, 20);
  cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(nameBuf.length, 28);
  cen.writeUInt32LE(offset, 42);
  central.push(cen, nameBuf);

  offset += local.length + nameBuf.length + comp.length;
}

const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);

const out = createWriteStream(resolve(root, outName));
out.write(Buffer.concat([...chunks, centralBuf, end]));
out.end(() => console.log(`Wrote ${outName} (${files.length} files)`));
