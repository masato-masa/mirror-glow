import { type Board, trace } from './engine.ts';

export interface Solution {
  /** 最少のタップ数（解が無ければ null） */
  par: number | null;
  /** 最少タップの解の数 */
  optimal: number;
  /** すべての解（クリアになる鏡の組み合わせ）の数 */
  total: number;
  /** 最少タップの解の 1 つ（鏡のビット） */
  best: number;
  /** 最少タップの解の全部 */
  bests: number[];
}

const pop = (x: number): number => {
  let n = 0;
  while (x) {
    n += x & 1;
    x >>= 1;
  }
  return n;
};

/** 鏡の組み合わせ 2^m を全部調べる（m は 12 以下を想定）。 */
export function solve(b: Board): Solution {
  const m = b.mirrors.length;
  let par: number | null = null;
  let optimal = 0;
  let total = 0;
  let best = 0;
  let bests: number[] = [];
  for (let mask = 0; mask < 1 << m; mask++) {
    if (trace(b, mask).lit.size !== b.stars.length) continue;
    total++;
    const k = pop(mask);
    if (par === null || k < par) {
      par = k;
      optimal = 1;
      best = mask;
      bests = [mask];
    } else if (k === par) {
      optimal++;
      bests.push(mask);
    }
  }
  return { par, optimal, total, best, bests };
}

/** 今の状態 cur から、解（目標の mask）へ近づく次の 1 タップ（鏡の番号）。いちばん手数の少ない解を選ぶ。 */
export function nextTap(b: Board, cur: number): number | null {
  const m = b.mirrors.length;
  let bestK: number | null = null;
  let bestMask = -1;
  for (let mask = 0; mask < 1 << m; mask++) {
    if (trace(b, mask).lit.size !== b.stars.length) continue;
    const dist = pop(mask ^ cur);
    if (bestK === null || dist < bestK) {
      bestK = dist;
      bestMask = mask;
    }
  }
  if (bestK === null || bestK === 0) return null;
  const diff = bestMask ^ cur;
  for (let k = 0; k < m; k++) if ((diff >> k) & 1) return k;
  return null;
}
