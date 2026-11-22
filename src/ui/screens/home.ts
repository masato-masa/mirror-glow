import crystal from '../../assets/crystal.png';
import gemOn from '../../assets/gem-on.png';
import lamp from '../../assets/lamp.png';
import mirror from '../../assets/mirror.png';
import { ALL_LEVELS } from '../../levels.ts';
import { iconGear } from '../icons.ts';
import { openDevSheet, openSettingsSheet } from '../sheets.ts';
import type { Deps } from '../types.ts';

/** ホームの絵。盤と同じ部品（ChatGPT 製）で、ランプ → 鏡 → クリスタル → ほし の光の道を見せる。 */
const art = (): string => `
<div class="home-hero" aria-hidden="true">
  <div class="hero-beam"></div>
  <img class="hero-lamp" src="${lamp}" alt="" />
  <img class="hero-mirror" src="${mirror}" alt="" />
  <img class="hero-crystal" src="${crystal}" alt="" />
  <img class="hero-gem" src="${gemOn}" alt="" />
</div>`;

export function renderHome(root: HTMLElement, deps: Deps): () => void {
  const { store } = deps;
  const draw = (): void => {
    const total = store.total();
    root.innerHTML = `
      <div class="app app-home home-screen">
        <div class="home-top">
          <button class="icon-btn settings-btn" type="button" aria-label="設定">${iconGear()}</button>
        </div>
        <div class="home">
          <div class="home-art">${art()}</div>
          <h1 class="home-title">かがみのひかり</h1>
          <p class="home-sub">かがみを まわして ひかりを とどけよう</p>
          <div class="home-buttons">
            <button class="home-btn primary resume-btn" type="button">${total > 0 ? 'つづきから' : 'はじめる'}</button>
            <button class="home-btn select-btn" type="button">ステージを えらぶ</button>
          </div>
          <p class="home-progress">★ ${total} / ${ALL_LEVELS.length * 3}</p>
        </div>
        <button class="dev-pill" type="button">テスト用</button>
      </div>`;
  };
  draw();
  const onClick = (ev: Event): void => {
    const t = ev.target as HTMLElement;
    if (t.closest('.resume-btn')) deps.go({ screen: 'play', levelId: store.firstUncleared() });
    else if (t.closest('.select-btn')) deps.go({ screen: 'select' });
    else if (t.closest('.settings-btn')) openSettingsSheet();
    else if (t.closest('.dev-pill')) openDevSheet(store, draw);
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
