/**
 * OGP画像（リンクをシェアしたときに出る 1200×630）を書き出す。
 *
 * 画像は静的な1枚なので、見る人の言語では出し分けられない
 * （X も LINE も og:image のURLを1つ取りに来るだけ）。
 * 日本語版と英語版の両方をここから作れるようにしておき、
 * どちらを og.png として置くかは配信側で決める。
 *
 *   node scripts/make-og.mjs ja   -> public/og.png
 *   node scripts/make-og.mjs en   -> public/og-en.png
 *
 * 描画は Chromium（Edge）の headless に任せる。
 * canvas のネイティブ依存を足さずに、本番と同じ字形で焼ける。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANG = (process.argv[2] || 'ja').toLowerCase();
const OUT = path.join(ROOT, 'public', LANG === 'en' ? 'og-en.png' : 'og.png');

/** 地図の道。lib/mappath.ts から素の文字列として読む（TSを実行せずに済ませる） */
function readPaths() {
  const src = fs.readFileSync(path.join(ROOT, 'lib', 'mappath.ts'), 'utf8');
  const out = [];
  const re = /'(M[^']{40,})'/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

/** headless で焼けるブラウザ。Windows は Edge が必ず居る */
function findBrowser() {
  const guesses = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  const hit = guesses.find((g) => fs.existsSync(g));
  if (!hit) throw new Error('Edge も Chrome も見つからない');
  return hit;
}

const COPY = {
  ja: {
    head: ['日本旅行の写真と', '記録をまとめよう'],
    body: [
      '訪れた場所を記録して、旅の写真をアルバムに残せます。',
      'あなたの写真も追加して、',
      '一緒にアルバムを完成させませんか？',
    ],
    headFamily: "'Yu Mincho','Hiragino Mincho ProN','MS Mincho',serif",
    headSize: 62,
    headLead: 76,
    headTop: 232,
    bodySize: 23,
  },
  en: {
    head: ['Keep your Japan trip', 'in one album'],
    body: [
      'Record the places you visit and keep the photos',
      'from your trip in one album. Add your own photos',
      'and finish it together.',
    ],
    headFamily: "Georgia,'Times New Roman',serif",
    headSize: 56,
    headLead: 70,
    headTop: 236,
    bodySize: 22,
  },
};

// 塗る都道府県（PREFECTURE_PATHS の並び = コード順）。
// 実際に旅した人の地図に見えるよう、まばらに散らす
const FILL = [0, 1, 3, 12, 13, 19, 25, 26, 27, 33, 39, 42, 46];

const paths = readPaths();
if (paths.length !== 47) throw new Error(`地図の道が ${paths.length} 本しか取れていない`);
const c = COPY[LANG] ?? COPY.ja;

const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0}</style>
<body>
<canvas id="c" width="1200" height="630"></canvas>
<script>
const PATHS = ${JSON.stringify(paths)};
const FILL = new Set(${JSON.stringify(FILL)});
const C = ${JSON.stringify(c)};
const ctx = document.getElementById('c').getContext('2d');

// 和紙の地
ctx.fillStyle = '#FBFAF6'; ctx.fillRect(0, 0, 1200, 630);

// 地図。右半分に大きく置く
ctx.save();
ctx.translate(600, 8);
ctx.scale(0.72, 0.72);
PATHS.forEach((d, i) => {
  const p = new Path2D(d);
  ctx.fillStyle = FILL.has(i) ? '#69AF00' : '#E7E6E0';
  ctx.fill(p);
  ctx.strokeStyle = '#FBFAF6'; ctx.lineWidth = 1.6; ctx.stroke(p);
});
ctx.restore();

// 御朱印の印。朱はここだけ
ctx.strokeStyle = '#C4432B'; ctx.lineWidth = 4;
ctx.beginPath(); ctx.arc(118, 118, 40, 0, Math.PI * 2); ctx.stroke();
ctx.fillStyle = '#C4432B';
ctx.font = "34px 'Yu Mincho','Hiragino Mincho ProN',serif";
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('\\u65c5', 118, 120);

// 見出し
ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
ctx.fillStyle = '#1C1A17';
ctx.font = C.headSize + 'px ' + C.headFamily;
C.head.forEach((l, i) => ctx.fillText(l, 78, C.headTop + i * C.headLead));

// 説明
ctx.fillStyle = '#5B5750';
ctx.font = C.bodySize + "px 'Yu Gothic','Hiragino Sans','Helvetica Neue',Arial,sans-serif";
C.body.forEach((l, i) => ctx.fillText(l, 78, 378 + i * 34));

// 抹茶色の罫と署名
ctx.fillStyle = '#69AF00'; ctx.fillRect(78, 490, 92, 4);
ctx.fillStyle = '#1C1A17';
ctx.font = "bold 30px 'Yu Gothic','Helvetica Neue',Arial,sans-serif";
ctx.fillText('My Japan', 78, 543);
ctx.fillStyle = '#8A867E';
ctx.font = "18px 'Yu Gothic','Helvetica Neue',Arial,sans-serif";
ctx.fillText('by MATCHA  \\u00b7  my-japan-matcha.com', 78, 573);
</script></body>`;

const tmp = path.join(os.tmpdir(), `og-${LANG}.html`);
fs.writeFileSync(tmp, html, 'utf8');

const browser = findBrowser();
const profile = path.join(os.tmpdir(), 'og-shot-profile');
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  `--user-data-dir=${profile}`,
  `--screenshot=${OUT}`,
  `file:///${tmp.replace(/\\/g, '/')}`,
], { stdio: 'ignore' });

fs.unlinkSync(tmp);
console.log('wrote', path.relative(ROOT, OUT), fs.statSync(OUT).size, 'bytes');
