/**
 * マイグレーションを1本適用する。
 *
 *   node scripts/apply-migration.mjs supabase/migrations/0027_matcha_articles.sql
 *   node scripts/apply-migration.mjs 0027            番号だけでも探して当てる
 *   node scripts/apply-migration.mjs 0027 --check    当てずに、いま何があるかだけ見る
 *
 * anon key では DDL が打てないので Management API に PAT で投げる。
 * **SQLはファイルから読んで JSON にして送る。** コマンドラインに直接
 * SQLを書くと、日本語のコメントや引用符でエスケープが壊れて 400 が返る
 * （CLAUDE.md に記録のある失敗）。ここを通せばその心配が無い。
 *
 * 必要な環境変数:
 *   SUPABASE_PAT          Management API のトークン（sbp_ で始まる）
 *   SUPABASE_PROJECT_REF  プロジェクトのref
 *
 * Windows の PowerShell なら:
 *   $env:SUPABASE_PAT="sbp_..."
 *   $env:SUPABASE_PROJECT_REF="tcyclvfinguwudztfgsb"
 *   node scripts/apply-migration.mjs 0027
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_PROJECT_REF;
const arg = process.argv[2];
const CHECK = process.argv.includes('--check');

if (!arg) {
  console.error('使い方: node scripts/apply-migration.mjs <SQLのパス | 番号> [--check]');
  process.exit(1);
}
if (!PAT || !REF) {
  console.error('SUPABASE_PAT と SUPABASE_PROJECT_REF を環境変数に入れてください。');
  console.error('  PAT の取り方: Supabase → 右上のアイコン → Account → Access Tokens');
  process.exit(1);
}

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    // ここが要点。SQLは本文としてJSONに載せる（シェルを通さない）
    body: JSON.stringify({ query }),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok || body?.message) {
    throw new Error(`${r.status} ${JSON.stringify(body ?? {}).slice(0, 500)}`);
  }
  return body;
}

/** 番号だけ渡されたら、その番号で始まるファイルを探す */
async function resolvePath(a) {
  if (a.endsWith('.sql')) return a;
  const dir = 'supabase/migrations';
  const files = await readdir(dir);
  const hit = files.find((f) => f.startsWith(a) && f.endsWith('.sql'));
  if (!hit) throw new Error(`${dir} に ${a} で始まる .sql がありません`);
  return join(dir, hit);
}

async function main() {
  const path = await resolvePath(arg);
  const text = await readFile(path, 'utf8');

  // 何のテーブルを触るSQLかを先に見せる（当てる前に確認できるように）
  const tables = [...text.matchAll(/create table (?:if not exists )?(\w+)/gi)].map((m) => m[1]);
  console.log(`ファイル: ${path}`);
  console.log(`作るテーブル: ${tables.length ? tables.join(', ') : '(create table なし)'}\n`);

  if (CHECK) {
    for (const t of tables) {
      const rows = await sql(
        `select count(*)::int as n from information_schema.tables where table_name = '${t}'`
      );
      const exists = (Array.isArray(rows) ? rows[0]?.n : 0) > 0;
      console.log(`  ${t}: ${exists ? 'すでにある' : 'まだ無い'}`);
      if (exists) {
        const c = await sql(`select count(*)::int as n from ${t}`);
        console.log(`    行数: ${Array.isArray(c) ? c[0]?.n : '?'}`);
      }
    }
    console.log('\n--check なので何も変えていません。');
    return;
  }

  console.log('適用します…');
  await sql(text);
  console.log('完了。\n');

  // 当てたあと、本当にできたかを確かめる（成功したと言い切る前に見る）
  for (const t of tables) {
    const rows = await sql(
      `select count(*)::int as n from information_schema.tables where table_name = '${t}'`
    );
    const ok = (Array.isArray(rows) ? rows[0]?.n : 0) > 0;
    console.log(`  ${t}: ${ok ? '出来ています' : '見つかりません（要確認）'}`);
  }
}

main().catch((e) => {
  console.error(`\n失敗: ${e.message}`);
  process.exit(1);
});
