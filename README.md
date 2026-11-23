# かがみのひかり

鏡をタップしてひっくり返し、ランプの光をすべての星まで届けるパズル。Claude が 0 から考えた 3 作目。

- 公開: https://masato-masa.github.io/mirror-glow/
- 規則: 光はまっすぐ進み、鏡（／ ＼）で曲がる。鏡のタップでむきが逆になる。星に光が当たるとつき、光は星で止まる（通りぬけない）。クリスタルは光を左右 2 本に分ける。星の数は光の本数（1 + クリスタルの数）以下。
- 面は 10 ワールド × 4 面（W8 からみあう・W9 めさきの わな 2・W10 ちょうじょうは鏡 7〜11 枚・par 4〜6 の難面）。素材は assets-src/parts3d.png（ChatGPT 製、台座つきの立体）を `node scripts/build-art.mjs` で切り出す。`npm run levels`（手筋ごとの条件で探索）→ `npm test`（par・最少の解が 1 つ・解の再生を全面で再検証）。
- `npm run dev` / `npm run build` / `npm run deploy`
