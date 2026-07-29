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
const ORIGIN = 'https://ashiato-nine.vercel.app';

const TITLE = '足跡 Ashiato — 日本の旅を、かたちに残そう';
const DESC =
  'Record your Japan trip, collect a goshuin for every prefecture, and keep it all as a journal. ' +
  '歩いた場所を記録して、御朱印を集めて、旅をジャーナルに。';

const HEAD = `
    <meta name="description" content="${DESC}" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icon-512.png" />
    <meta name="theme-color" content="#8CC63F" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Ashiato" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:image" content="${ORIGIN}/og.png" />
    <meta property="og:url" content="${ORIGIN}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="Turn your Japan trip into a keepsake." />
    <meta name="twitter:image" content="${ORIGIN}/og.png" />
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
html = html.replace('</head>', `${HEAD}  </head>`);

writeFileSync(FILE, html);
console.log('inject-head: title, favicon and OGP added to dist/index.html');
