// アプリアイコン: 夜色の地にランプ（ChatGPT 製の部品）を置く。  node scripts/build-icons.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png'], [64, 'favicon.png']]) {
  const inner = Math.round(size * 0.66);
  const lamp = await sharp('src/assets/lamp.png').resize(inner, inner).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#1d2146' } })
    .composite([{ input: lamp, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`public/${name}`);
}
console.log('icons done');
