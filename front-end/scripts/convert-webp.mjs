/**
 * Converts the three heavy public images to WebP.
 * Run with: node scripts/convert-webp.mjs
 * Requires: npm install --save-dev sharp
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const conversions = [
  { src: 'mangroves.jpg',       dest: 'mangroves.webp',       quality: 82 },
  { src: 'alpine_mountain.jpg', dest: 'alpine_mountain.webp', quality: 82 },
  { src: 'realistic_sun.png',   dest: 'realistic_sun.webp',   quality: 85 },
];

for (const { src, dest, quality } of conversions) {
  const input  = resolve(publicDir, src);
  const output = resolve(publicDir, dest);
  try {
    const info = await sharp(input).webp({ quality }).toFile(output);
    console.log(`✓ ${src} → ${dest}  (${(info.size / 1024).toFixed(0)} KiB)`);
  } catch (e) {
    console.error(`✗ ${src}:`, e.message);
  }
}
