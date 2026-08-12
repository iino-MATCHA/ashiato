/**
 * 出来上がった記事SQLを目で確かめるための小さな道具。
 *
 *   node scripts/check-article-quality.mjs jp 7        # 福島県の日本語ぶん
 *   node scripts/check-article-quality.mjs jp          # 全県の1行まとめ
 *
 * 「押した先に、その場所がどんなところか出るか」を確かめるためのもの。
 * 札(place)・題・本文の書き出し・出典を並べるだけで、何も直さない。
 */
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';

const [lang = 'jp', codeArg] = process.argv.slice(2);
const code = codeArg ? Number(codeArg) : null;

/** E'...' の逃がしを戻す */
const un = (s) => s.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');

const files = readdirSync('supabase/seed/articles')
  .filter((f) => f.startsWith(`${lang}_`))
  .sort();

const rows = [];
for (const f of files) {
  const sql = await readFile(`supabase/seed/articles/${f}`, 'utf8');
  // (E'url', E'lang', code, E'title', E'body', E'images'::jsonb, ..., E'place', E'attr', E'url')
  const re = /\(E'((?:[^'\\]|\\.)*)', E'((?:[^'\\]|\\.)*)', (\d+), E'((?:[^'\\]|\\.)*)', E'((?:[^'\\]|\\.)*)', E'(?:(?:[^'\\]|\\.)*)'::jsonb, (?:null|E'(?:[^'\\]|\\.)*'::timestamptz), (null|E'(?:[^'\\]|\\.)*'), (null|E'(?:[^'\\]|\\.)*'), (null|E'(?:[^'\\]|\\.)*')\)/g;
  let m;
  while ((m = re.exec(sql))) {
    rows.push({
      code: Number(m[3]),
      title: un(m[4]),
      body: un(m[5]),
      place: m[6] === 'null' ? null : un(m[6].slice(2, -1)),
      attr: m[7] === 'null' ? null : un(m[7].slice(2, -1)),
    });
  }
}

if (code) {
  const rs = rows.filter((r) => r.code === code);
  console.log(`${lang} / 県コード ${code} … ${rs.length}件\n`);
  for (const r of rs) {
    console.log(`── 札: ${r.place ?? '(なし)'}`);
    console.log(`   題: ${r.title}`);
    console.log(`   出典: ${r.attr ?? 'MATCHAの本文のまま'}`);
    console.log(`   本文: ${r.body.replace(/\n+/g, ' / ').slice(0, 150)}`);
    console.log(`   段落数: ${r.body.split(/\n\s*\n/).filter(Boolean).length}\n`);
  }
} else {
  const withPlace = rows.filter((r) => r.place).length;
  const swapped = rows.filter((r) => r.attr).length;
  console.log(`${lang}: ${rows.length}件 / 札あり ${withPlace} / 概要に差し替え ${swapped}`);
  const byPref = new Map();
  for (const r of rows) byPref.set(r.code, (byPref.get(r.code) ?? 0) + (r.place ? 1 : 0));
  const empty = [...byPref].filter(([, n]) => n === 0).map(([c]) => c);
  console.log(`札が1つも無い県: ${empty.length ? empty.join(', ') : 'なし'}`);
}
