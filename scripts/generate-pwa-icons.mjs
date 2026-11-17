import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

// Original Shaikh's geometric S monogram; no external image or font input.
const check = process.argv.includes('--check');
if (!check) await fs.mkdir('public/icons', { recursive: true });
for (const [file, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['maskable-512.png', 512, true]]) {
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="${maskable ? 0 : 110}" fill="#b44316"/><path d="M337 156c-18-23-46-35-80-35-52 0-88 28-88 69 0 45 39 62 79 76 39 13 62 25 62 49 0 23-23 39-54 39-33 0-62-18-82-45l-28 30c25 36 64 56 111 56 59 0 101-32 101-80 0-47-39-67-87-83-36-12-56-22-56-44 0-19 17-32 43-32 25 0 45 11 62 29z" fill="#faf8f4" transform="${maskable ? 'translate(51 51) scale(.8)' : ''}"/></svg>`;
  const bytes = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  const path = 'public/icons/' + file;
  if (check) assert.deepEqual(bytes, await fs.readFile(path), 'Icon must match its original generator: ' + file);
  else await fs.writeFile(path, bytes);
}
console.log(check ? 'PASS: all three PWA icons match original source' : 'Generated original PWA icons');
