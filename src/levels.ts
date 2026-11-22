import data from './levels.json';
import { type Board, parseRows } from './engine.ts';

export interface LevelDef {
  id: string;
  rows: string[];
  par: number;
}
export interface WorldDef {
  id: string;
  name: string;
  trick: string;
  levels: LevelDef[];
}

export const WORLDS: WorldDef[] = data.map((w, i) => ({ id: `W${i + 1}`, name: w.name, trick: w.trick, levels: w.levels }));
export const ALL_LEVELS: LevelDef[] = WORLDS.flatMap((w) => w.levels);
export const getLevel = (id: string): LevelDef | undefined => ALL_LEVELS.find((l) => l.id === id);
export const boardOf = (l: LevelDef): Board => parseRows(l.rows);
export const nextLevelId = (id: string): string | null => {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < ALL_LEVELS.length ? ALL_LEVELS[i + 1]!.id : null;
};
/** ★: par 以内 = 3、+1 = 2、それ以上 = 1 */
export const starsFor = (taps: number, par: number): 1 | 2 | 3 => (taps <= par ? 3 : taps <= par + 1 ? 2 : 1);
