// かがみのひかり: 光の進み方（盤・鏡・ひかりの道すじ）。画面にもソルバーにも依存しない純粋な計算。
//
// 規則は 3 つだけ。
//  1. ランプから光が出て、まっすぐ進む。かべに当たると消える。
//  2. 鏡（／ ＼）に当たると 90 度曲がる。鏡をタップするとむきが逆になる（／⇄＼）。
//  3. ほしに光が当たると、ほしがつく。光はほしで止まる（通りぬけない）。ほしを全部つけたらクリア。
// ほかの部品: クリスタル（光を左右 2 本に分ける）、固定の鏡（タップできない）。

export const W = 6;
export const H = 7;

/** 向き。0=上 1=右 2=下 3=左 */
export type Dir = 0 | 1 | 2 | 3;
export const DR = [-1, 0, 1, 0] as const;
export const DC = [0, 1, 0, -1] as const;

/**
 * 盤の文字。
 *  . 空　# かべ　* ほし　Y クリスタル　/ ＼ タップできる鏡（初期のむき）　a b 固定の鏡（／ ＼）
 *  ^ > v < ランプ（光を出す向き）
 */
export type Kind = '.' | '#' | '*' | 'Y' | '/' | '\\' | 'a' | 'b' | '^' | '>' | 'v' | '<';

export interface Board {
  /** 行ごとの文字列（長さ W、H 行） */
  rows: string[];
  /** タップできる鏡のセル番号（r*W+c）。順番がビット番号 */
  mirrors: number[];
  source: { r: number; c: number; dir: Dir };
  stars: number[];
}

export const parseRows = (rows: string[]): Board => {
  const mirrors: number[] = [];
  const stars: number[] = [];
  let source: Board['source'] | null = null;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]!;
      const i = r * W + c;
      if (ch === '/' || ch === '\\') mirrors.push(i);
      else if (ch === '*') stars.push(i);
      else if (ch === '^') source = { r, c, dir: 0 };
      else if (ch === '>') source = { r, c, dir: 1 };
      else if (ch === 'v') source = { r, c, dir: 2 };
      else if (ch === '<') source = { r, c, dir: 3 };
    }
  });
  if (!source) throw new Error('ランプが無い');
  return { rows, mirrors, source, stars };
};

/** 鏡で曲がった向き。'/' : 上→右 右→上 下→左 左→下。'\' : 上→左 左→上 下→右 右→下 */
export const bounce = (slash: boolean, d: Dir): Dir => (slash ? ([1, 0, 3, 2][d] as Dir) : ([3, 2, 1, 0][d] as Dir));

export interface Segment {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
}

export interface Trace {
  segments: Segment[];
  /** 光が届いたほしのセル番号 */
  lit: Set<number>;
  /** セルごとに、光が通った回数（鏡の共有の判定用） */
  passes: Map<number, number>;
  /** クリスタルを通った回数 */
  splits: number;
}

/** 鏡の状態 mask（ビット = 反転しているか）で光を追う。 */
export function trace(b: Board, mask: number): Trace {
  const flipped = new Map<number, boolean>();
  b.mirrors.forEach((cell, k) => flipped.set(cell, ((mask >> k) & 1) === 1));
  const segments: Segment[] = [];
  const lit = new Set<number>();
  const passes = new Map<number, number>();
  let splits = 0;
  const seen = new Set<number>();
  const queue: { r: number; c: number; d: Dir }[] = [{ r: b.source.r, c: b.source.c, d: b.source.dir }];
  let guard = 0;
  while (queue.length && guard++ < 400) {
    const beam = queue.pop()!;
    let { r, c } = beam;
    let d = beam.d;
    for (let step = 0; step < 80; step++) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) {
        segments.push({ r0: r, c0: c, r1: nr, c1: nc });
        break;
      }
      const key = (nr * W + nc) * 4 + d;
      const ch = b.rows[nr]![nc]!;
      if (ch === '#') {
        segments.push({ r0: r, c0: c, r1: r + DR[d] * 0.5, c1: c + DC[d] * 0.5 });
        break;
      }
      segments.push({ r0: r, c0: c, r1: nr, c1: nc });
      const cell = nr * W + nc;
      if (ch === '*') {
        lit.add(cell); // ほしに光が当たるとともり、光はそこで止まる（通りぬけない）
        break;
      }
      if (ch === '^' || ch === '>' || ch === 'v' || ch === '<') break;
      if (seen.has(key)) break;
      seen.add(key);
      passes.set(cell, (passes.get(cell) ?? 0) + 1);
      r = nr;
      c = nc;
      if (ch === '/' || ch === '\\') {
        const slash = (ch === '/') !== (flipped.get(cell) ?? false);
        d = bounce(slash, d);
      } else if (ch === 'a' || ch === 'b') {
        d = bounce(ch === 'a', d);
      } else if (ch === 'Y') {
        splits++;
        queue.push({ r, c, d: ((d + 1) % 4) as Dir });
        d = ((d + 3) % 4) as Dir;
      }
    }
  }
  return { segments, lit, passes, splits };
}

export const isClear = (b: Board, mask: number): boolean => trace(b, mask).lit.size === b.stars.length;

/** いまのむきで鏡が「／」か */
export const isSlash = (b: Board, cell: number, mask: number): boolean => {
  const k = b.mirrors.indexOf(cell);
  const ch = b.rows[Math.floor(cell / W)]![cell % W]!;
  const flipped = k >= 0 && ((mask >> k) & 1) === 1;
  return (ch === '/') !== flipped;
};
