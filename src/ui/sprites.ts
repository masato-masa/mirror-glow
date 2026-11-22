// 盤の部品の見た目。ChatGPT で作った絵（scripts/build-art.mjs で切り出した PNG）を使う。
import crystal from '../assets/crystal.png';
import gemOff from '../assets/gem-off.png';
import gemOn from '../assets/gem-on.png';
import lamp from '../assets/lamp.png';
import mirror from '../assets/mirror.png';
import wall from '../assets/wall.png';

const img = (src: string, cls = ''): string => `<img class="${cls}" src="${src}" alt="" draggable="false" />`;

export function sprite(ch: string): string {
  switch (ch) {
    case '#':
      return `<i class="spr wall">${img(wall)}</i>`;
    case '*':
      return `<i class="spr gem">${img(gemOff, 'off')}${img(gemOn, 'onimg')}</i>`;
    case 'Y':
      return `<i class="spr crystal">${img(crystal)}</i>`;
    case '/':
    case '\\':
      return `<i class="spr mirror">${img(mirror)}</i>`;
    case 'a':
      return `<i class="spr mirror fixed slash">${img(mirror)}</i>`;
    case 'b':
      return `<i class="spr mirror fixed back">${img(mirror)}</i>`;
    case '^':
    case '>':
    case 'v':
    case '<':
      return `<i class="spr lamp">${img(lamp)}</i>`;
    default:
      return '';
  }
}
