// 面を「手筋を先に決めて」探す。ワールドごとに決めた手筋（下の SPEC）を満たす盤だけを、スロット番号をシードにした
// 決定的な乱数で探し、ソルバーで「最少タップの解が 1 つだけ」を確かめて src/levels.json に書く。
//   node --experimental-strip-types scripts/gen-levels.ts
import { writeFileSync } from 'node:fs';
import { H, W, parseRows, trace } from '../src/engine.ts';
import { solve } from '../src/solver.ts';

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface Spec {
  name: string;
  /** 手筋の説明（Vault に書く） */
  trick: string;
  mirrors: [number, number];
  stars: [number, number];
  crystals: [number, number];
  locked: [number, number];
  walls: [number, number];
  /** 面ごとの目標 par */
  pars: number[];
  /** 最少の解で、同じ鏡に 2 回以上光が通ること（1 枚の鏡が 2 つの役を持つ） */
  shared?: boolean;
  /** 最少の解で、クリスタルが光を割ること */
  split?: boolean;
  /** 最少の解で、クリスタルが光を割る回数の下限 */
  minSplits?: number;
  /** 最少の解で光が通る鏡のマスの数の下限（光が行き来する） */
  minMirrorsLit?: number;
  /** 目先の最善手が罠: 1 手でいちばん多くほしをつける鏡は、唯一の最少の解に入っていない */
  darkFirst?: boolean;
  /** 最初から星が 1 つ以上ついていて、最少の解のどれかの鏡を 1 枚だけ返すと、ついている星が減る（あえて一度消す） */
  unlight?: boolean;
}

const SPEC: Spec[] = [
  { name: 'はじめの かがみ', trick: '鏡を 1 枚ひっくり返して、光を曲げる', mirrors: [3, 4], stars: [1, 2], crystals: [0, 0], locked: [0, 0], walls: [2, 4], pars: [1, 1, 2, 2] },
  { name: 'ひとつで ふたつ', trick: '同じ鏡に光が 2 回通る。1 枚が 2 つの役をする', mirrors: [5, 6], stars: [2, 2], crystals: [0, 0], locked: [0, 0], walls: [3, 5], pars: [2, 2, 3, 3], shared: true },
  { name: 'プリズム', trick: 'クリスタルが光を 2 本に分ける。どちらの枝も生かす', mirrors: [5, 7], stars: [2, 3], crystals: [1, 1], locked: [0, 0], walls: [3, 5], pars: [2, 3, 3, 3], split: true },
  { name: 'かたい かがみ', trick: '動かせない鏡をよけて、動かせる鏡の順を読む', mirrors: [6, 8], stars: [3, 3], crystals: [1, 2], locked: [1, 3], walls: [3, 5], pars: [3, 3, 4, 4], split: true },
  { name: 'ぐるぐる ひかり', trick: 'クリスタル 2 つで光が 3 本に分かれ、同じ鏡を何度も通る。1 枚の返し方が 3 本の枝を同時に変える', mirrors: [7, 9], stars: [4, 4], crystals: [2, 2], locked: [1, 2], walls: [3, 5], pars: [4, 4, 5, 5], shared: true, split: true, minSplits: 2 },
  { name: 'めさきの わな', trick: '1 手でいちばん星がつく鏡は、答えに入っていない。目先の明るさに釣られず、鏡の組み合わせで読む', mirrors: [5, 8], stars: [2, 3], crystals: [0, 1], locked: [0, 1], walls: [3, 5], pars: [2, 3, 3, 4], darkFirst: true },
  { name: 'あえて けす', trick: '最初からついている星を、あえて一度消す鏡がある。ついているものを守ろうとすると行き詰まる', mirrors: [5, 8], stars: [3, 3], crystals: [0, 1], locked: [0, 1], walls: [3, 5], pars: [2, 3, 3, 4], unlight: true },
];

const between = (rnd: () => number, [lo, hi]: [number, number]): number => lo + Math.floor(rnd() * (hi - lo + 1));

function randomBoard(rnd: () => number, spec: Spec): string[] | null {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const free: [number, number][] = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) free.push([r, c]);
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [free[i], free[j]] = [free[j]!, free[i]!];
  }
  // ランプは外周の縁、内向き
  const edge: [number, number, string][] = [];
  for (let r = 0; r < H; r++) {
    edge.push([r, 0, '>']);
    edge.push([r, W - 1, '<']);
  }
  for (let c = 1; c < W - 1; c++) {
    edge.push([0, c, 'v']);
    edge.push([H - 1, c, '^']);
  }
  const e = edge[Math.floor(rnd() * edge.length)]!;
  g[e[0]]![e[1]] = e[2];
  const put = (ch: string): void => {
    for (;;) {
      const p = free.pop();
      if (!p) return;
      if (g[p[0]]![p[1]] !== '.') continue;
      g[p[0]]![p[1]] = ch;
      return;
    }
  };
  const nM = between(rnd, spec.mirrors);
  for (let i = 0; i < nM; i++) put(rnd() < 0.5 ? '/' : '\\');
  for (let i = between(rnd, spec.crystals); i > 0; i--) put('Y');
  for (let i = between(rnd, spec.locked); i > 0; i--) put(rnd() < 0.5 ? 'a' : 'b');
  for (let i = between(rnd, spec.walls); i > 0; i--) put('#');
  for (let i = between(rnd, spec.stars); i > 0; i--) put('*');
  return g.map((r) => r.join(''));
}

interface Found {
  rows: string[];
  par: number;
}

const why: Record<string, number> = {};
const no = (k: string): void => {
  why[k] = (why[k] ?? 0) + 1;
};

function find(spec: Spec, slot: number, par: number): Found | null {
  const rnd = mulberry32(0x9e3779b1 ^ (slot * 7919));
  for (let attempt = 0; attempt < 300000; attempt++) {
    const rows = randomBoard(rnd, spec);
    if (!rows) continue;
    const b = parseRows(rows);
    if (b.stars.length === 0 || b.mirrors.length > 10) continue;
    // 最初から解けている・ほしが多すぎる盤は捨てる
    if (trace(b, 0).lit.size === b.stars.length) continue;
    const s = solve(b);
    if (s.par !== par) { no('par'); continue; }
    if (s.optimal !== 1) { no('optimal'); continue; }
    if (s.total > par + 3) { no('total'); continue; } // 解が多すぎる盤は、どう押しても通る
    const t = trace(b, s.best);
    if (t.segments.length < 9) continue;
    if (spec.split && t.splits < (spec.minSplits ?? 1)) continue;
    if (spec.shared) {
      let two = false;
      for (const cell of b.mirrors) if ((t.passes.get(cell) ?? 0) >= 2) two = true;
      if (!two) continue;
    }
    if (spec.darkFirst) {
      // 「目先の最善手が罠」: 1 手でいちばん多くのほしをつける鏡（同点は全部）が、唯一の最少の解に入っていない。
      const lit0 = trace(b, 0).lit.size;
      let top = lit0;
      for (let k = 0; k < b.mirrors.length; k++) top = Math.max(top, trace(b, 1 << k).lit.size);
      if (top === lit0) { no('top'); continue; } // 1 手で増える鏡が無い盤は、罠にならない
      let trap = true;
      for (let k = 0; k < b.mirrors.length; k++) if (trace(b, 1 << k).lit.size === top && (s.best >> k) & 1) trap = false;
      if (!trap) { no('trap'); continue; }
    }
    if (spec.unlight) {
      const lit0 = trace(b, 0).lit.size;
      if (lit0 < 1) { no('lit0'); continue; }
      let down = false;
      for (let k = 0; k < b.mirrors.length; k++) if (((s.best >> k) & 1) && trace(b, 1 << k).lit.size < lit0) down = true;
      if (!down) { no('down'); continue; }
    }
    // 解に出てこない（反転しない）鏡が多い盤は、飾りが多いので避ける
    let used = 0;
    for (let k = 0; k < b.mirrors.length; k++) if ((s.best >> k) & 1) used++;
    if (used < Math.min(par, 2)) continue;
    return { rows, par };
  }
  return null;
}

const only = process.env.ONLY_W ? Number(process.env.ONLY_W) : 0;
import { readFileSync } from 'node:fs';
const prev = ((): any[] => {
  try {
    return JSON.parse(readFileSync(new URL('../src/levels.json', import.meta.url), 'utf8'));
  } catch {
    return [];
  }
})();
const out = SPEC.map((w, wi) => (only && wi + 1 !== only && prev[wi] ? prev[wi] : {
  name: w.name,
  trick: w.trick,
  levels: w.pars.map((par, li) => {
    const slot = wi * 10 + li + 1;
    const f = find(w, slot, par);
    if (!f) { console.log(JSON.stringify(why)); throw new Error(`見つからない: W${wi + 1}-${li + 1} par ${par}`); }
    console.log(`W${wi + 1}-${li + 1} par ${par}`);
    return { id: `${wi + 1}-${li + 1}`, rows: f.rows, par: f.par };
  }),
}));
writeFileSync(new URL('../src/levels.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('書き出した');
