import { type Board, H, W, isSlash, trace } from '../../engine.ts';
import { boardOf, getLevel, nextLevelId, starsFor } from '../../levels.ts';
import { nextTap } from '../../solver.ts';
import { iconBack, iconGear, iconHelp, iconHint, iconReset, iconUndo } from '../icons.ts';
import { sprite } from '../sprites.ts';
import { openHelpSheet, openSettingsSheet } from '../sheets.ts';
import { sfx } from '../sfx.ts';
import type { Deps } from '../types.ts';

export function renderGame(root: HTMLElement, levelId: string, deps: Deps): () => void {
  const def = getLevel(levelId);
  if (!def) {
    deps.go({ screen: 'home' });
    return () => {};
  }
  const level = def;
  const board: Board = boardOf(level);
  const next = nextLevelId(level.id);
  let mask = 0;
  const history: number[] = [];
  let taps = 0;
  let winTimer = 0;
  let toastTimer = 0;
  let hintTimer = 0;
  let disposed = false;
  let cleared = false;
  let prevLit = 0;

  let cells = '';
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const ch = board.rows[r]![c]!;
      const i = r * W + c;
      const tappable = board.mirrors.includes(i);
      cells += `<div class="cell${tappable ? ' tap' : ''}" data-i="${i}" data-k="${ch}">${sprite(ch)}</div>`;
    }
  }

  root.innerHTML = `
    <div class="app app-game game-screen">
      <header class="header">
        <div class="header-row">
          <div class="header-left"><button class="icon-btn back-btn" type="button" aria-label="もどる">${iconBack()}</button></div>
          <h1 class="title">${level.id}</h1>
          <div class="header-actions">
            <button class="icon-btn help-btn" type="button" aria-label="遊びかた">${iconHelp()}</button>
            <button class="icon-btn settings-btn" type="button" aria-label="設定">${iconGear()}</button>
          </div>
        </div>
        <div class="status-bar">
          <span class="stat"><span class="stat-label">タップ</span><span class="stat-num taps">0</span><span class="stat-label">さいたん ${level.par}</span></span>
          <span class="stat"><span class="stat-label">ほし</span><span class="stat-num lit">0</span><span class="stat-label">/ ${board.stars.length}</span></span>
        </div>
      </header>
      <div class="board-wrap">
        <div class="board" style="--cols:${W};--rows:${H}">
          ${cells}
          <svg class="beams" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"></svg>
          <div class="toast" hidden></div>
        </div>
      </div>
      <footer class="footer">
        <button class="tool undo-btn" type="button" aria-label="もどす" disabled>${iconUndo()}</button>
        <button class="tool retry-btn" type="button" aria-label="やりなおし">${iconReset()}</button>
        <button class="tool hint-btn" type="button" aria-label="ヒント">${iconHint()}</button>
      </footer>
      <div class="overlay game-message" hidden>
        <div class="sheet message-card">
          <p class="message-title">クリア!</p>
          <div class="stars"></div>
          <p class="message-moves"></p>
          <div class="message-buttons">
            <button class="sheet-btn next-btn" type="button">つぎへ</button>
            <button class="sheet-btn quiet again-btn" type="button">もういちど</button>
            <button class="sheet-btn quiet select-btn" type="button">ステージせんたく</button>
          </div>
        </div>
      </div>
    </div>`;

  const q = <T extends HTMLElement | SVGElement>(sel: string): T => root.querySelector<T>(sel)!;
  const boardEl = q<HTMLElement>('.board');
  const beamsEl = q<SVGElement>('.beams');
  const toastEl = q<HTMLElement>('.toast');
  const tapsEl = q<HTMLElement>('.taps');
  const litEl = q<HTMLElement>('.lit');
  const undoBtn = q<HTMLButtonElement>('.undo-btn');
  const msg = q<HTMLElement>('.game-message');
  const cellEls = Array.from(boardEl.querySelectorAll<HTMLElement>('.cell'));
  if (!next) q('.next-btn').setAttribute('hidden', '');

  const clamp = (v: number, hi: number): number => Math.max(0, Math.min(hi, v));

  /** 光の道すじとほしの点灯を、いまの mask に合わせて描き直す。鏡のむきも合わせる。 */
  function render(play = false): void {
    const t = trace(board, mask);
    const lines = t.segments
      .map((s) => `<line x1="${s.c0 + 0.5}" y1="${s.r0 + 0.5}" x2="${clamp(s.c1 + 0.5, W)}" y2="${clamp(s.r1 + 0.5, H)}"/>`)
      .join('');
    beamsEl.innerHTML = `<g class="glow">${lines}</g><g class="core">${lines}</g>`;
    for (const i of board.mirrors) {
      const el = cellEls[i]!;
      const slash = isSlash(board, i, mask);
      el.classList.toggle('slash', slash);
      el.classList.toggle('back', !slash);
    }
    let n = 0;
    for (const i of board.stars) {
      const on = t.lit.has(i);
      const el = cellEls[i]!;
      const was = el.classList.contains('on');
      el.classList.toggle('on', on);
      if (on && !was && play) {
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
        sfx.star(n);
      }
      if (on) n++;
    }
    litEl.textContent = String(n);
    if (play && n < prevLit) sfx.lose();
    prevLit = n;
    if (n === board.stars.length && !cleared) {
      cleared = true;
      winTimer = window.setTimeout(showClear, 520);
    }
  }
  for (const i of board.mirrors) {
    const el = cellEls[i]!;
    el.classList.add(isSlash(board, i, 0) ? 'slash' : 'back');
  }
  render();

  const toast = (t: string): void => {
    toastEl.textContent = t;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toastEl.hidden = true), 1800);
  };

  function showClear(): void {
    if (disposed) return;
    const stars = starsFor(taps, level.par);
    deps.store.record(level.id, stars, taps);
    sfx.clear();
    q('.stars').innerHTML = [0, 1, 2].map((i) => `<span class="star${i < stars ? ' on' : ''}" style="--i:${i}">★</span>`).join('');
    q('.message-moves').textContent = taps <= level.par ? `${taps} タップ — さいたん!` : `${taps} タップ（さいたん ${level.par}）`;
    msg.hidden = false;
  }

  function clearHint(): void {
    cellEls.forEach((e) => e.classList.remove('hint'));
    window.clearTimeout(hintTimer);
  }

  const flip = (cell: number): void => {
    if (!msg.hidden || cleared) return;
    const k = board.mirrors.indexOf(cell);
    if (k < 0) {
      sfx.nope();
      const c = cellEls[cell]!;
      c.classList.remove('nope');
      void c.offsetWidth;
      c.classList.add('nope');
      return;
    }
    history.push(mask);
    mask ^= 1 << k;
    taps++;
    tapsEl.textContent = String(taps);
    undoBtn.disabled = false;
    clearHint();
    sfx.flip();
    render(true);
  };

  const reset = (): void => {
    window.clearTimeout(winTimer);
    mask = 0;
    history.length = 0;
    taps = 0;
    cleared = false;
    tapsEl.textContent = '0';
    undoBtn.disabled = true;
    msg.hidden = true;
    clearHint();
    render();
  };

  const undo = (): void => {
    if (!history.length || !msg.hidden || cleared) return;
    mask = history.pop()!;
    taps--;
    tapsEl.textContent = String(taps);
    undoBtn.disabled = history.length === 0;
    sfx.undo();
    clearHint();
    render();
  };

  const hint = (): void => {
    if (cleared || !msg.hidden) return;
    clearHint();
    const k = nextTap(board, mask);
    if (k === null) {
      toast('ここからは むずかしそう。ひとつ もどしてみよう');
      return;
    }
    cellEls[board.mirrors[k]!]!.classList.add('hint');
    hintTimer = window.setTimeout(clearHint, 4000);
  };

  // 指を置いた瞬間に反応する
  const onPointerDown = (ev: PointerEvent): void => {
    const c = (ev.target as HTMLElement).closest<HTMLElement>('.cell');
    if (!c || !boardEl.contains(c)) return;
    ev.preventDefault();
    flip(Number(c.dataset.i));
  };
  boardEl.addEventListener('pointerdown', onPointerDown);

  const onClick = (ev: Event): void => {
    const t = ev.target as HTMLElement;
    if (t.closest('.back-btn')) deps.go({ screen: 'select' });
    else if (t.closest('.help-btn')) openHelpSheet();
    else if (t.closest('.settings-btn')) openSettingsSheet();
    else if (t.closest('.undo-btn')) undo();
    else if (t.closest('.retry-btn')) reset();
    else if (t.closest('.hint-btn')) hint();
    else if (t.closest('.next-btn') && next) deps.go({ screen: 'play', levelId: next });
    else if (t.closest('.again-btn')) reset();
    else if (t.closest('.select-btn')) deps.go({ screen: 'select' });
  };
  root.addEventListener('click', onClick);
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === 'z' || ev.key === 'Backspace') undo();
  };
  window.addEventListener('keydown', onKey);

  return () => {
    disposed = true;
    window.clearTimeout(winTimer);
    window.clearTimeout(toastTimer);
    window.clearTimeout(hintTimer);
    boardEl.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
  };
}
