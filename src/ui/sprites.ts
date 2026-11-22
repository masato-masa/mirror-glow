// 盤の部品の見た目。ChatGPT で作った絵（scripts/build-art.mjs で切り出した PNG）を使う。
import crystal from '../assets/crystal.png';
import gemOff from '../assets/gem-off.png';
import gemOn from '../assets/gem-on.png';
import lamp from '../assets/lamp.png';
import mirror from '../assets/mirror.png';
import wall from '../assets/wall.png';

const img = (src: string, cls: string): string => `<img class="spr ${cls}" src="${src}" alt="" draggable="false" />`;

/** 1 部品 = 1 要素（<img>）。星は点灯で src を差し替える（game.ts）。 */
export const GEM_OFF = gemOff;
export const GEM_ON = gemOn;

export function sprite(ch: string): string {
  switch (ch) {
    case '#':
      return img(wall, 'wall');
    case '*':
      return img(gemOff, 'gem');
    case 'Y':
      return img(crystal, 'crystal');
    case '/':
    case String.fromCharCode(92):
      return img(mirror, 'mirror');
    case 'a':
      return img(mirror, 'mirror slash');
    case 'b':
      return img(mirror, 'mirror back');
    case '^':
    case '>':
    case 'v':
    case '<':
      return img(lamp, 'lamp');
    default:
      return '';
  }
}
