// 部品シート（assets-src/parts.png、ChatGPT で作成。3 列 2 行: ランプ・消えた星・ついた星・鏡・クリスタル・石）を、
// 背景の白を透明にして 6 つに切り出す。  node scripts/build-art.mjs   
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const { data, info } = await sharp('assets-src/parts.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const white = (i) => data[i] > 222 && data[i + 1] > 222 && data[i + 2] > 222;
const seen = new Uint8Array(w * h);
const stack = [0, w - 1, (h - 1) * w, h * w - 1];
while (stack.length) {
  const p = stack.pop();
  if (seen[p] || !white(p * 4)) continue;
  seen[p] = 1;
  data[p * 4 + 3] = 0;
  const x = p % w;
  if (x > 0) stack.push(p - 1);
  if (x < w - 1) stack.push(p + 1);
  if (p >= w) stack.push(p - w);
  if (p < (h - 1) * w) stack.push(p + w);
}
const spans = (len, has) => {
  const out = [];
  let s = -1;
  for (let i = 0; i <= len; i++) {
    if (i < len && has(i)) { if (s < 0) s = i; }
    else if (s >= 0) { if (i - s > 30) out.push([s, i - 1]); s = -1; }
  }
  return out;
};
const rows = spans(h, (y) => { for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 0) return true; return false; });
if (rows.length !== 2) throw new Error(`行 ${rows.length}`);
const names = ['lamp', 'gem-off', 'gem-on', 'mirror', 'crystal', 'wall'];
let k = 0;
for (const [y0, y1] of rows) {
  const cols = spans(w, (x) => { for (let y = y0; y <= y1; y++) if (data[(y * w + x) * 4 + 3] > 0) return true; return false; });
  if (cols.length !== 3) throw new Error(`列 ${cols.length}`);
  for (const [x0, x1] of cols) {
    let ty0 = y1, ty1 = y0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (data[(y * w + x) * 4 + 3] > 0) { ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); }
    await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: x0, top: ty0, width: x1 - x0 + 1, height: ty1 - ty0 + 1 })
      .resize({ width: 128, height: 128, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(`src/assets/${names[k++]}.png`);
  }
}
console.log('done');
