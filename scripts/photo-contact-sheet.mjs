/**
 * 写真を一覧に焼いて、目で確かめるための道具。
 *
 * 見本データの写真は、URLが200を返すことだけを確かめて入れると必ず事故る。
 * 実際、北海道の地点に象が写り、「Fukuoka Ramen」に市街の遠景が付いていた。
 * DBから引いた地点と写真を並べて1枚にし、それを見てから入れること。
 *
 *   node scripts/photo-contact-sheet.mjs items.json out.png
 *
 * items.json は [{ key, image, title, query }] の配列。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const [, , inPath, outPath] = process.argv;
const items = JSON.parse(fs.readFileSync(inPath, 'utf8')).filter((x) => x.image);

const COLS = 6;
const CELL = 260;
const LABEL = 46;
const rows = Math.ceil(items.length / COLS);
const W = COLS * CELL;
const H = rows * (CELL + LABEL);

const html = `<!doctype html><meta charset="utf-8">
<style>
 html,body{margin:0;background:#111;color:#fff;font:13px/1.3 system-ui,sans-serif}
 .g{display:grid;grid-template-columns:repeat(${COLS},${CELL}px)}
 .c{width:${CELL}px;height:${CELL + LABEL}px;box-sizing:border-box;padding:4px}
 .i{width:${CELL - 8}px;height:${CELL - 8}px;object-fit:cover;background:#333}
 .t{font-weight:700;color:#8CC63F}
 .s{color:#bbb;font-size:11px}
</style>
<div class="g">
${items.map((x, i) => `<div class="c">
  <img class="i" src="${x.image.replace(/"/g, '&quot;')}" referrerpolicy="no-referrer">
  <div class="t">${i}. ${x.key}</div>
  <div class="s">${(x.title || x.query || '').replace(/</g, '')}</div>
</div>`).join('\n')}
</div>`;

const tmp = path.join(os.tmpdir(), 'contact-sheet.html');
fs.writeFileSync(tmp, html, 'utf8');

const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

execFileSync(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${W},${H}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'sheet-profile-' + Date.now())}`,
  '--virtual-time-budget=20000',
  `--screenshot=${outPath}`,
  `file:///${tmp.replace(/\\/g, '/')}`,
], { stdio: 'ignore' });

console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes,', items.length, 'images');
