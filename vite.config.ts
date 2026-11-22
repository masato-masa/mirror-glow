import { defineConfig } from 'vite';

// GitHub Pages のプロジェクトページは /mirror-glow/ 配下。本番ビルドだけベースパスを付ける。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mirror-glow/' : '/',
}));
