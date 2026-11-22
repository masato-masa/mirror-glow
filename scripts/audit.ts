// 全面の再検証: 最初から解けていない・最少タップが par と一致・最少の解がちょうど 1 つ・ほしが全部つく解がある。
//   npm test
import { isClear, parseRows } from '../src/engine.ts';
import data from '../src/levels.json' with { type: 'json' };
import { solve } from '../src/solver.ts';

const ALL_LEVELS = data.flatMap((w) => w.levels);
let ng = 0;
const t0 = Date.now();
for (const l of ALL_LEVELS) {
  const b = parseRows(l.rows);
  const s = solve(b);
  const problems: string[] = [];
  if (isClear(b, 0)) problems.push('最初から解けている');
  if (s.par !== l.par) problems.push(`par 不一致（解いた結果 ${s.par}、面の値 ${l.par}）`);
  if (s.optimal !== 1) problems.push(`最少の解が ${s.optimal} 個`);
  if (s.best !== 0 && !isClear(b, s.best)) problems.push('解の再生が通らない');
  if (b.mirrors.length > 12) problems.push('鏡が多すぎる');
  if (problems.length) {
    ng++;
    console.log(`NG ${l.id}: ${problems.join(' / ')}`);
  }
}
console.log(`${ALL_LEVELS.length} 面、NG ${ng}（${Date.now() - t0}ms）`);
process.exit(ng ? 1 : 0);
