import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * 【注意】web.output が "single" の間、このファイルは使われない。
 * Expo Router が +html.tsx を読むのは静的レンダリング(output: "static")のときだけで、
 * いまは既定のテンプレートから index.html が生成される。
 * タイトル・ファビコン・OGPは scripts/inject-head.mjs が書き出し後に差し込んでいる。
 *
 * Web-only HTML shell. Ensures the app fills the visual viewport on mobile
 * (dynamic viewport height so the bottom tab bar is never cut off) and that
 * layout is full-width and doesn't scroll horizontally.
 */
const css = `
/* Fixed-height app shell: the app always fits the VISIBLE viewport exactly,
   so the bottom tab bar is never cut off. Screens scroll internally. */
html { height: 100%; }
body {
  margin: 0;
  height: 100%;
  box-sizing: border-box; /* safe-area paddings are inside the height */
  /* 安全領域は body では取らない。ここで余白を取ると、画面ごとの
     SafeAreaView が同じぶんをもう一度足して二重になり、下のタブバーが
     浮いて背景の帯が見える。安全領域は各画面とタブバーが自分で持つ。 */
  overflow-x: hidden;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}
@supports (height: 100dvh) {
  body { height: 100dvh; }
/* Chrome(Android/iOS) はURLバーの出入りで表示領域が伸び縮みする。
   dvh は「今の高さ」なので、バーが降りてくる途中で土台が縦にはみ出し、
   一番下のタブバーが隠れていた。svh は「バーが出ている前提の高さ」。 */
@supports (height: 100svh) {
  body { height: 100svh; }
}
/* 最後の砦: 実測の高さ（下のscriptが --vh を入れる）を最優先で使う */
body { height: var(--vh, 100svh); }
 /* dynamic viewport = excludes browser chrome */
}
#root { display: flex; flex-direction: column; height: 100%; width: 100%; }
/* no browser focus ring anywhere — the app draws its own underline/borders.
   (covers :focus and :focus-visible, incl. RNW's inner focus outlines) */
*, *:focus, *:focus-visible { outline: none !important; }
input, textarea, select, [contenteditable] {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 0;
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* タブアイコンとSNSシェア時のカード（画像は public/ → dist 直下に配られる） */}
        <title>My Japan — 日本の旅を、かたちに残そう</title>
        <meta name="description" content="Record your Japan trip, collect a goshuin for every prefecture, and keep it all as a journal. 歩いた場所を記録して、御朱印を集めて、旅をジャーナルに。" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="My Japan" />
        <meta property="og:title" content="My Japan — 日本の旅を、かたちに残そう" />
        <meta property="og:description" content="Record your Japan trip, collect a goshuin for every prefecture, and keep it as a journal." />
        <meta property="og:image" content="https://www.my-japan-matcha.com/og.png" />
        <meta property="og:url" content="https://www.my-japan-matcha.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="My Japan" />
        <meta name="twitter:description" content="Turn your Japan trip into a keepsake." />
        <meta name="twitter:image" content="https://www.my-japan-matcha.com/og.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* 見えている高さを実測して --vh に入れる（スマホChromeのツールバー対策） */}
        <script
          dangerouslySetInnerHTML={{ __html: `
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
` }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
