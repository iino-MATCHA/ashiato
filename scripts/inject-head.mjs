/**
 * dist/index.html の <head> にメタ情報を差し込む。
 *
 * web.output が "single" のとき、Expo Router は app/+html.tsx を使わず
 * 既定のテンプレートで index.html を吐く。そのためタイトル・ファビコン・OGPが
 * 一切入らない。静的レンダリングへ切り替えると影響範囲が広いので、
 * 書き出し後にここで差し込む。
 *
 * 使い方: expo export -p web && node scripts/inject-head.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = 'dist/index.html';
// 本番ドメイン。Vercel のプレビュー等で変えたいときは SITE_ORIGIN を渡す。
// apex は www へ 301 されるので、正規のホストは www 側。
const ORIGIN = (process.env.SITE_ORIGIN || 'https://www.my-japan-matcha.com').replace(/\/$/, '');

const TITLE = 'My Japan — 日本の旅を、かたちに残そう';
const DESC =
  'Record your Japan trip, collect a goshuin for every prefecture, and keep it all as a journal. ' +
  '歩いた場所を記録して、御朱印を集めて、旅をジャーナルに。';

/**
 * アプリの土台になるCSS。app/+html.tsx にも同じものが書いてあるが、
 * output:"single" ではそちらが使われないので、ここでも配る。
 *
 *  - 画面の高さは「見えている分」ちょうどにする（下のタブが切れないように）
 *  - **入力欄にブラウザ既定のフォーカス枠を出さない**。この枠が出ると
 *    タイトル欄やコメント欄が青い箱で囲まれてしまう。枠は各画面が
 *    下線で描いているので、ブラウザ側の装飾は全部止める
 */
const CSS = `
html { height: 100%; }
body {
  margin: 0;
  height: 100%;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  overflow-x: hidden;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}
@supports (height: 100dvh) { body { height: 100dvh; } }
#root { display: flex; flex-direction: column; height: 100%; width: 100%; }
*, *:focus, *:focus-visible, *:focus-within { outline: none !important; }
input, textarea, select, [contenteditable] {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
}
`.trim();

const HEAD = `
    <meta name="description" content="${DESC}" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icon-512.png" />
    <meta name="theme-color" content="#8CC63F" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="My Japan" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:image" content="${ORIGIN}/og.png" />
    <meta property="og:url" content="${ORIGIN}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="Turn your Japan trip into a keepsake." />
    <meta name="twitter:image" content="${ORIGIN}/og.png" />
    <style id="app-shell">${CSS}</style>
`;

if (!existsSync(FILE)) {
  console.error(`inject-head: ${FILE} not found — run "expo export -p web" first`);
  process.exit(1);
}

let html = readFileSync(FILE, 'utf8');

if (html.includes('property="og:image"')) {
  console.log('inject-head: already injected, skipping');
  process.exit(0);
}

html = html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
// 既定の viewport は下端の安全領域を考えていない。ノッチ端末で描画域を全面にする
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />'
);
html = html.replace('</head>', `${HEAD}  </head>`);

writeFileSync(FILE, html);
console.log('inject-head: title, favicon and OGP added to dist/index.html');
