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

const TITLE = 'My Japan — Keep all your Japan memories in one place';
/** リンクを貼ったときカードに出る文章。ここが読まれる本文になる。
    画像と同じく1種類しおけないので、訪日客に合わせて英語で持つ */
const DESC =
  'Track the places you visit and save your favorite travel photos ' +
  'in a single digital album.';

/**
 * アプリの土台になるCSS。app/+html.tsx にも同じものが書いてあるが、
 * output:"single" ではそちらが使われないので、ここでも配る。
 *
 *  - 画面の高さは「見えている分」ちょうどにする（下のタブが切れないように）
 *  - **入力欄にブラウザ既定のフォーカス枠を出さない**。この枠が出ると
 *    タイトル欄やコメント欄が青い箱で囲まれてしまう。枠は各画面が
 *    下線で描いているので、ブラウザ側の装飾は全部止める
 */
/**
 * 見えている高さを実測して --vh に入れる。
 * ピンチズーム中(scaleが1でない)は視覚ビューポートが縮むだけなので無視。
 * キーボードが出たときは縮む＝タブバーがキーボードの上に乗る。それでよい。
 */
const VH_SCRIPT = `
(function () {
  var last = 0;
  function set() {
    var vv = window.visualViewport;
    var h = vv && Math.abs(vv.scale - 1) < 0.05 ? vv.height : window.innerHeight;
    h = Math.round(h);
    if (h > 0 && Math.abs(h - last) > 1) {
      last = h;
      document.documentElement.style.setProperty('--vh', h + 'px');
    }
  }
  set();
  window.addEventListener('resize', set);
  window.addEventListener('orientationchange', set);
  window.addEventListener('pageshow', set);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', set);
    window.visualViewport.addEventListener('scroll', set);
  }
  /* resizeを出さずにツールバーだけ出し入れするブラウザがあるので、
     取りこぼしの保険として定期的にも見る。値が変わったときしか書かない */
  setInterval(set, 800);
})();
`;

const CSS = `
/* 画面の外側にも同じ地の色を敷く。
   キーボードが出て土台(--vh)が縮むと、その下から素の白が覗いていた。 */
html, body { background-color: #FFFFFF; }
@media (prefers-color-scheme: dark) {
  html, body { background-color: #151310; }
}
html { height: 100%; }
body {
  margin: 0;
  height: 100%;
  box-sizing: border-box;
  /* 安全領域は body では取らない。ここで余白を取ると、画面ごとの
     SafeAreaView が同じぶんをもう一度足して二重になり、下のタブバーが
     浮いて背景の帯が見える。安全領域は各画面とタブバーが自分で持つ。 */
  overflow-x: hidden;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}
@supports (height: 100dvh) { body { height: 100dvh; } }
/* Chrome(Android/iOS) はURLバーの出入りで表示領域が伸び縮みする。
   dvh は「今の高さ」なので、バーが降りてくる途中で土台が縦にはみ出し、
   一番下のタブバーが隠れていた。svh は「バーが出ている前提の高さ」なので、
   どの状態でも画面内に収まる。バーが消えたときに下が少し空くだけで済む。 */
@supports (height: 100svh) { body { height: 100svh; } }
/* それでも Chrome のスマホ版では、ツールバーが「重なって」表示される
   状態があり、CSSの単位だけでは追いきれなかった。最後の砦として、
   実際に見えている高さ(visualViewport)をJSで測って --vh に入れ、
   それを最優先で使う。単位の理屈で悩むのはここで終わりにする。 */
body { height: var(--vh, 100svh); }
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

/** GA4。SPAなので初回の page_view はここ、以後の遷移は app/_layout が送る */
const GA_ID = 'G-4DM6J1C4K0';
const GA = `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    </script>`;

const HEAD = `${GA}
    <meta name="description" content="${DESC}" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon-512.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#8CC63F" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="My Japan" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:image" content="${ORIGIN}/og-en.png" />
    <meta property="og:url" content="${ORIGIN}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESC}" />
    <meta name="twitter:image" content="${ORIGIN}/og-en.png" />
    <style id="app-shell">${CSS}</style>
    <script id="app-vh">${VH_SCRIPT}</script>
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
