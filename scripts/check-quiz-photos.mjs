/**
 * lib/quiz/photos.ts の47件が本当に配信されるかを確かめる。
 *
 * Wikimedia は任意の幅を配信するとは限らず、原寸より大きい幅は拒否する。
 * 写真を差し替えたら必ずこれを通す（LPで画像が1枚も出ない事故を防ぐ）。
 *
 *   node scripts/check-quiz-photos.mjs
 */
import { readFileSync } from 'node:fs';

const src = readFileSync('lib/quiz/photos.ts', 'utf8');

// const C = '...' を解いてから、各行の url を取り出す
const base = /const C = '([^']+)'/.exec(src)?.[1] ?? '';
const rows = [...src.matchAll(/^\s{2}(\d+):\s*\{\s*title:\s*'([^']*)',\s*url:\s*([`'])(.+?)\3\s*\}/gm)].map(
  ([, code, title, , url]) => ({ code: Number(code), title, url: url.replace('${C}', base) })
);

if (rows.length !== 47) {
  console.error(`check-quiz-photos: 47件そろっていない（${rows.length}件しか読めなかった）`);
  process.exit(1);
}

const UA = 'my-japan-photo-check/1.0 (https://www.my-japan-matcha.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0;

/** 429（回数制限）は壊れているわけではないので、間を置いて数回だけ試す */
async function head(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
      if (res.status !== 429) return res;
      await sleep(1500 * (i + 1));
    } catch {
      await sleep(500);
    }
  }
  return null;
}

for (const r of rows) {
  let status = 0;
  let size = '';
  const res = await head(r.url);
  if (res) {
    status = res.status;
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len) size = `${Math.round(len / 1024)}KB`;
  }
  // 続けて叩きすぎると弾かれるので、少しずつ
  await sleep(120);
  if (status !== 200) {
    bad++;
    console.log(`✗ ${String(r.code).padStart(2)} ${r.title} → ${status}\n   ${r.url}`);
  } else {
    console.log(`✓ ${String(r.code).padStart(2)} ${r.title} ${size}`);
  }
}

console.log(bad === 0 ? `\nall ${rows.length} ok` : `\n${bad} broken`);
process.exit(bad === 0 ? 0 : 1);
