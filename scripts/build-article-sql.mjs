/**
 * matcha_articles の取り込みSQLを組み立てる。
 *
 *   node scripts/build-article-sql.mjs
 *
 * 元にするのは scripts/import-matcha-articles.mjs が出した
 * supabase/seed/0027_matcha_articles_{jp,en,ko,cn,tw}.sql。
 * ここでやるのは2つ:
 *
 * 1) **地名（place）を付ける。**
 *    県のカードの「◯◯県で行くなら」の段は、記事の題ではなく行き先の名前で
 *    並べたい（「福島市の気温は？年間平均と…」ではなく「会津若松」）。
 *    MATCHAの記事ページは記事ごとの地名を持っていないので、題と本文を
 *    観光エリア(tourism_area_master) → 市区町村(municipalities_master) の
 *    順に照合して決める。観光エリアを先に見るのは、そちらが行き先の名前
 *    そのものだから（会津若松・大内宿・五色沼）。
 *
 * 2) **貼り付けで壊れない形にする。**
 *    ファイルを貼ると行頭の `-` が `\-` に化けて
 *    `syntax error at or near "\"` になった（実際に起きた）。
 *    なので **コメント行を置かず、文字列の中に改行を入れない**。
 *    本文の改行は E'…\n\n…' で表す。こうすると行頭に来るのは
 *    insert / values / ( / on conflict / 列名 だけになる。
 *
 * 入力に使うマスタは scripts/fetch-masters.mjs が置いた
 * .masters/areas.json と .masters/munis.json。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const LANGS = [
  ['jp', 'ja', 'name_ja', 'municipality_ja'],
  ['en', 'en', 'name_en', 'municipality_en'],
  ['ko', 'ko', 'name_ko', 'municipality_ko'],
  ['cn', 'zh-Hans', 'name_zh_hans', 'municipality_zh_hans'],
  ['tw', 'zh-Hant', 'name_zh_hant', 'municipality_zh_hant'],
];

/** SQLの文字列。E'' で書くので `\` と `'` を両方逃がし、改行は \n にする */
const e = (v) =>
  v === null || v === undefined
    ? 'null'
    : `E'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r\n?|\n/g, '\\n')}'`;

/** 出来上がったSQLから行を読み戻す（'' 逃がしを見ながら） */
function rowsOf(sql) {
  const body = sql.split('values')[1].split('\non conflict')[0];
  const out = [];
  let i = 0;
  while (true) {
    const k = body.indexOf("\n  ('https", i);
    if (k < 0) break;
    const vals = [];
    // k は改行の位置。k+3 が行頭の `(` なので、その次から読む
    let j = k + 4;
    let depth = 0;
    for (; j < body.length; j++) {
      const c = body[j];
      if (c === "'") {
        let t = j + 1;
        let buf = '';
        for (; t < body.length; t++) {
          if (body[t] === "'") {
            if (body[t + 1] === "'") { buf += "'"; t++; continue; }
            break;
          }
          buf += body[t];
        }
        vals.push(buf);
        j = t;
      } else if (c === '(') depth++;
      else if (c === ')') { if (depth === 0) break; depth--; }
    }
    const seg = body.slice(k, j);
    const code = Number(/',\s*(\d+),\s*'/.exec(seg)[1]);
    out.push({
      url: vals[0], lang: vals[1], code, title: vals[2], body: vals[3],
      images: JSON.parse(vals[4]), published: vals[5] ?? null,
    });
    i = j;
  }
  return out;
}

/**
 * 記事の地名を決める。
 * 題にあるものを本文にあるものより優先し、観光エリアを市区町村より優先する。
 * 同じ強さなら長い名前（＝細かい地名）を採る
 */
function placeOf(row, areas, munis, areaKey, muniKey) {
  const cands = [];
  for (const a of areas) {
    if (a.prefecture_code !== row.code) continue;
    const n = a[areaKey];
    if (n && n.length >= 2) cands.push({ n, rank: 0 });
    /**
     * 日本語の地名でも探す（出すのはその言語の名前のまま）。
     * 韓国語の記事は地名を音で写すので（会津若松→아이즈와카마쓰）
     * 表記が揺れて当たらない。漢字が併記されていることが多いので拾える
     */
    if (n && a.name_ja && a.name_ja !== n && a.name_ja.length >= 2) {
      cands.push({ n, needle: a.name_ja, rank: 1 });
    }
  }
  for (const m of munis) {
    if (m.prefecture_code !== row.code) continue;
    const n = m[muniKey];
    if (!n || n.length < 2) continue;
    cands.push({ n, rank: 2 });
    // 「三春滝桜」から「三春町」を引けるよう、市区町村の語尾を落とした形も見る
    const bare = n.replace(/[市区町村]$/u, '');
    if (bare.length >= 2 && bare !== n) cands.push({ n, needle: bare, rank: 3 });
    if (m.municipality_ja && m.municipality_ja !== n) {
      const ja = m.municipality_ja.replace(/[市区町村]$/u, '');
      if (ja.length >= 2) cands.push({ n, needle: ja, rank: 4 });
    }
  }
  let best = null;
  for (const c of cands) {
    const needle = c.needle ?? c.n;
    const inTitle = row.title.indexOf(needle);
    const inBody = inTitle >= 0 ? -1 : row.body.indexOf(needle);
    const where = inTitle >= 0 ? 0 : inBody >= 0 ? 1 : -1;
    if (where < 0) continue;
    /**
     * 同じ強さで並んだときは、先に出てくる方を採る。
     * 「日本三大桜のひとつ・三春滝桜の…福島の花見名所に行こう」では
     * 「三春」も「福島」も市区町村を縮めた形で題に当たるが、
     * 記事が扱っているのは先に出てくる三春の方
     */
    const at = inTitle >= 0 ? inTitle : inBody;
    /**
     * **どこに出てきたかより、何の名前かを先に見る。**
     * 題に「福島・鶴ヶ城公園」とあると、市区町村「福島市」を縮めた
     * 「福島」が題で当たり、本文にある「会津若松」に勝ってしまっていた。
     * 観光エリアの名前は行き先そのものなので、こちらを常に優先する
     */
    const score = [c.rank, where, -needle.length, at];
    if (!best || cmpArr(score, best.score) < 0) best = { name: c.n, score };
  }
  return best?.name ?? null;
}

/** [何の名前か, 題か本文か, 名前の長さ, 出てくる位置] を順に見る */
const cmpArr = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

const HEAD =
  'insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at, place)\nvalues\n';
const TAIL = `on conflict (url, lang) do update set
prefecture_code = excluded.prefecture_code,
title = excluded.title,
body = excluded.body,
images = excluded.images,
published_at = excluded.published_at,
place = excluded.place;
`;

const PER = 50;

const areas = JSON.parse(await readFile('.masters/areas.json', 'utf8'));
const munis = JSON.parse(await readFile('.masters/munis.json', 'utf8'));
await mkdir('supabase/seed/articles', { recursive: true });

let total = 0;
let withPlace = 0;
for (const [L, lang, areaKey, muniKey] of LANGS) {
  const sql = await readFile(`supabase/seed/0027_matcha_articles_${L}.sql`, 'utf8');
  const rows = rowsOf(sql);
  for (const r of rows) {
    r.place = placeOf(r, areas, munis, areaKey, muniKey);
    if (r.place) withPlace++;
  }
  total += rows.length;
  const parts = Math.ceil(rows.length / PER);
  for (let p = 0; p < parts; p++) {
    const chunk = rows.slice(p * PER, (p + 1) * PER);
    const values = chunk
      .map(
        (r) =>
          `(${e(r.url)}, ${e(lang)}, ${r.code}, ${e(r.title)}, ${e(r.body)}, ${e(
            JSON.stringify(r.images)
          )}::jsonb, ${r.published ? `${e(r.published)}::timestamptz` : 'null'}, ${e(r.place)})`
      )
      .join(',\n');
    const name = `supabase/seed/articles/${L}_${p + 1}of${parts}.sql`;
    await writeFile(name, HEAD + values + '\n' + TAIL);
    console.log(`${name}  ${chunk.length}件`);
  }
  const got = rows.filter((r) => r.place).length;
  console.log(`  ${L}: 地名が付いた ${got}/${rows.length}`);
}
console.log(`\n合計 ${total} 件 / 地名あり ${withPlace}`);
