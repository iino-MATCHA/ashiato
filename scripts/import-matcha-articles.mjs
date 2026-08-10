/**
 * MATCHAの記事を matcha_articles（0027）へ取り込む。
 * 県のカードのポップアップに出す「抜粋」を作るためのもの。
 *
 *   node scripts/import-matcha-articles.mjs --dry-run          何を入れるか見るだけ
 *   node scripts/import-matcha-articles.mjs --lang jp --limit 40
 *   node scripts/import-matcha-articles.mjs --urls list.txt    URLを自分で並べる
 *   node scripts/import-matcha-articles.mjs --drop             取り込んだ分を消す
 *
 * **このスクリプトは matcha-jp.com に繋がる場所で動かす。**
 * 開発コンテナからは matcha-jp.com も supabase.co も遮断されているので、
 * 手元のPCか、社内のバッチから実行すること。
 *
 * 必要な環境変数（scripts/seed-demo-users.mjs と同じ）:
 *   SUPABASE_PAT          Management API のトークン
 *   SUPABASE_PROJECT_REF  プロジェクトのref
 *
 * ---------------------------------------------------------------------------
 * 記事をどう見つけるか
 * ---------------------------------------------------------------------------
 * sitemap.xml から記事のURLを集める（--urls でファイルから読ませてもよい）。
 * MATCHAのCMSに直接繋げるなら、そちらの一覧に差し替えた方が速い ――
 * その場合 collectUrls() だけを書き換えれば、あとはそのまま使える。
 *
 * ---------------------------------------------------------------------------
 * どの県の記事かをどう決めるか
 * ---------------------------------------------------------------------------
 * 記事の中にある `list?region=1xx` のリンクから引く。
 * **MATCHAの region は JISコード + 100**（101=北海道 … 147=沖縄）なので、
 * 100を引けば県コードになる（CLAUDE.md に記録がある規則）。
 * 複数の県が出てくる記事は、最も多く出てきた県のものとして扱う。
 * 1つも見つからない記事は入れない（どの県のカードに出すか決まらない）。
 *
 * ---------------------------------------------------------------------------
 * 本文をどう作るか
 * ---------------------------------------------------------------------------
 * **全文は取らない。** ポップアップは「味見 → 続きはMATCHAで」の作りなので、
 * 導入の段落だけを最大4つ拾う。og:description があればそれを先頭に置く。
 * 要約は生成しない（AIは使わない ―― 0017 で外した方針のまま）。
 */

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_PROJECT_REF;

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

const DRY = has('dry-run');
const DROP = has('drop');
/** MATCHA側の言語のパス。アプリの言語札へはこの表で変換する */
const LANG = flag('lang', 'jp');
const LIMIT = Number(flag('limit', '40'));
const URLS_FILE = flag('urls');
const SITEMAP = flag('sitemap', 'https://matcha-jp.com/sitemap.xml');

/** MATCHAのパス → アプリの言語札（lib/i18n の Locale と同じ） */
const LOCALE_OF = { jp: 'ja', en: 'en', ko: 'ko', cn: 'zh-Hans', tw: 'zh-Hant' };
const LOCALE = LOCALE_OF[LANG];
if (!LOCALE) {
  console.error(`--lang は ${Object.keys(LOCALE_OF).join(' / ')} のいずれか`);
  process.exit(1);
}
if (!DRY && (!PAT || !REF)) {
  console.error('SUPABASE_PAT / SUPABASE_PROJECT_REF を入れてください（--dry-run なら不要）');
  process.exit(1);
}

// ---------------------------------------------------------------- Supabase

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await r.json();
  if (!r.ok || body?.message) throw new Error(JSON.stringify(body).slice(0, 400));
  return body;
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

// ---------------------------------------------------------------- 取り出し

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .trim();

const meta = (html, prop) => {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const m = html.match(re) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
  );
  return m ? text(m[1]) : null;
};

/** 記事に出てくる region から県コードを決める（いちばん多いもの） */
function prefectureOf(html) {
  const counts = new Map();
  for (const m of html.matchAll(/list\?region=(\d{3})/g)) {
    const code = Number(m[1]) - 100;
    if (code >= 1 && code <= 47) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  if (!counts.size) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** 導入の段落を最大4つ。全文は取らない */
function bodyOf(html, description) {
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => text(m[1]))
    // 案内・注記の短い行や、リンクだけの行は落とす
    .filter((s) => s.length >= 40 && !/^https?:/.test(s))
    .slice(0, 4);
  const out = [];
  if (description) out.push(description);
  paras.forEach((p) => {
    // og:description と同じ文が二度並ばないようにする
    if (!out.some((o) => o.startsWith(p.slice(0, 30)) || p.startsWith(o.slice(0, 30)))) out.push(p);
  });
  return out.slice(0, 4).join('\n\n');
}

/** 本文に添える写真。og:image を先頭に、記事中の画像を足して最大4枚 */
function imagesOf(html, ogImage) {
  const urls = [];
  const push = (u) => {
    if (!u || urls.includes(u) || !/^https?:\/\//.test(u)) return;
    // 飾り・アイコン・ロゴは避ける
    if (/(logo|icon|sprite|avatar|banner)/i.test(u)) return;
    urls.push(u);
  };
  push(ogImage);
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
  return urls.slice(0, 4);
}

// ---------------------------------------------------------------- 収集

async function collectUrls() {
  if (URLS_FILE) {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(URLS_FILE, 'utf8');
    return raw.split('\n').map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
  }
  console.log(`sitemap を読む: ${SITEMAP}`);
  const r = await fetch(SITEMAP);
  if (!r.ok) throw new Error(`sitemap が読めません (${r.status})`);
  const xml = await r.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  // sitemap が sitemap を並べている形（index）なら、その先も読む
  const nested = locs.filter((u) => /\.xml($|\?)/.test(u));
  let all = locs.filter((u) => !/\.xml($|\?)/.test(u));
  for (const s of nested.slice(0, 12)) {
    try {
      const rr = await fetch(s);
      if (!rr.ok) continue;
      const t = await rr.text();
      all.push(...[...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    } catch {}
  }
  /**
   * その言語の記事URLだけに絞る（一覧・検索・タグのページは外す）。
   * ホスト名は sitemap の URL から取る ―― matcha-jp.com を決め打ちにすると
   * 検証用のサーバや社内のstagingで一件も通らない。
   */
  const host = new URL(SITEMAP).host;
  return all.filter((u) => {
    try {
      const x = new URL(u);
      return (
        x.host === host &&
        x.pathname.startsWith(`/${LANG}/`) &&
        x.pathname.split('/').filter(Boolean).length >= 2 &&
        !/^\/[^/]+\/(list|search|tag|category|about|contact)/.test(x.pathname) &&
        !x.search
      );
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------- 本体

async function main() {
  if (DROP) {
    if (DRY) { console.log('--dry-run と --drop は同時に使えません'); return; }
    const res = await sql(`delete from matcha_articles where lang = ${q(LOCALE)} returning id`);
    console.log(`${Array.isArray(res) ? res.length : 0} 件消しました（lang=${LOCALE}）`);
    return;
  }

  const urls = await collectUrls();
  console.log(`記事の候補: ${urls.length} 件 → 先頭 ${LIMIT} 件を見ます\n`);

  const rows = [];
  let skipped = 0;
  for (const url of urls.slice(0, LIMIT)) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'my-japan-importer/1.0' } });
      if (!r.ok) { skipped++; continue; }
      const html = await r.text();

      const code = prefectureOf(html);
      const title = meta(html, 'og:title') ?? text((html.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1] ?? '');
      const description = meta(html, 'og:description');
      const body = bodyOf(html, description);
      const images = imagesOf(html, meta(html, 'og:image'));
      const published = meta(html, 'article:published_time') ?? meta(html, 'og:updated_time');

      if (!code || !title || body.length < 60) {
        skipped++;
        console.log(`  skip  ${url}  (${!code ? '県が特定できない' : '本文が短い'})`);
        continue;
      }
      rows.push({ url, title, body, images, code, published: published?.slice(0, 10) ?? null });
      console.log(`  ok    [${String(code).padStart(2, '0')}] ${title.slice(0, 44)}`);
      // 相手のサーバに負荷をかけない
      await new Promise((s) => setTimeout(s, 400));
    } catch (e) {
      skipped++;
      console.log(`  fail  ${url}  ${e.message.slice(0, 60)}`);
    }
  }

  console.log(`\n入れる: ${rows.length} 件 / 見送り: ${skipped} 件`);
  if (!rows.length) return;

  if (DRY) {
    console.log('\n--- 1件目の中身 ---');
    const s = rows[0];
    console.log(`県コード: ${s.code}\n題: ${s.title}\n写真: ${s.images.length}枚`);
    console.log(`本文(段落${s.body.split('\n\n').length}):\n${s.body.slice(0, 400)}…`);
    console.log('\n--dry-run なので何も書き込んでいません。');
    return;
  }

  // 同じ url+lang は入れ直す（unique 制約に合わせて upsert）
  const values = rows
    .map(
      (r) =>
        `(${q(r.url)}, ${q(LOCALE)}, ${r.code}, ${q(r.title)}, ${q(r.body)},` +
        ` ${q(JSON.stringify(r.images))}::jsonb, ${r.published ? q(r.published) + '::timestamptz' : 'null'})`
    )
    .join(',\n');
  await sql(
    `insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
     values ${values}
     on conflict (url, lang) do update set
       prefecture_code = excluded.prefecture_code,
       title = excluded.title,
       body = excluded.body,
       images = excluded.images,
       published_at = excluded.published_at`
  );
  console.log(`書き込みました（lang=${LOCALE}）`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
