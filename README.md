# かがみのひかり

鏡をタップしてひっくり返し、ランプの光をすべての星まで届けるパズル。Claude が 0 から考えた 3 作目。

- 公開: https://masato-masa.github.io/mirror-glow/
- 規則: 光はまっすぐ進み、鏡（／ ＼）で曲がる。鏡のタップでむきが逆になる。星に光が通るとつく。クリスタルは光を左右 2 本に分ける。
- 面は 4 ワールド × 4 面。`npm run levels`（手筋ごとの条件で探索）→ `npm test`（par・最少の解が 1 つ・解の再生を全面で再検証）。
- `npm run dev` / `npm run build` / `npm run deploy`
