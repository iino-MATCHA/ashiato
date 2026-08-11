/**
 * MATCHAの記事を matcha_articles（0027）へ取り込む。
 * 県のカードのポップアップに出す「抜粋」を作るためのもの。
 *
 *   node scripts/import-matcha-articles.mjs --dry-run          何を入れるか見るだけ
 *   node scripts/import-matcha-articles.mjs --dry-run --sql    貼れるINSERT文を出す
 *   node scripts/import-matcha-articles.mjs --dry-run --json   中身をJSONで出す
 *   node scripts/import-matcha-articles.mjs --by-prefecture      47県ぜんぶから集める
 *   node scripts/import-matcha-articles.mjs --lang jp --limit 40
 *   node scripts/import-matcha-articles.mjs --urls list.txt    URLを自分で並べる
 *   node scripts/import-matcha-articles.mjs --drop             取り込んだ分を消す
 *
 * SUPABASE_PAT を持っていれば直接書き込む。持っていないときは
 * `--dry-run --sql` でINSERT文を出して、SQL Editorに貼る。
 *
 * 必要な環境変数（--dry-run なら不要）:
 *   SUPABASE_PAT          Management API のトークン
 *   SUPABASE_PROJECT_REF  プロジェクトのref
 *
 * ---------------------------------------------------------------------------
 * 記事をどう見つけるか
 * ---------------------------------------------------------------------------
 * **sitemapは言語ごとにある**（`/{lang}/sitemap.xml`）。ルートの `/sitemap.xml` は
 * トップへ301で飛ぶだけで、記事は1件も取れない。中身はsitemapのindexで、
 * `/{lang}/articles/YYYY-MM.xml` が月ごとに並ぶ。新しい月から順に読む。
 * **`<loc>` の中身はCDATAで包まれている**ので、それを剥がしてからURLにする。
 *
 * ---------------------------------------------------------------------------
 * どの県の記事かをどう決めるか
 * ---------------------------------------------------------------------------
 * **パンくず（`c-breadcrumbs`）の `list?region=1xx` だけを見る。**
 * **MATCHAの region は JISコード + 100**（101=北海道 … 147=沖縄）なので、
 * 100を引けば県コードになる（CLAUDE.md に記録がある規則）。
 *
 * ページ全体から region を数えてはいけない ―― ヘッダの地域メニューが
 * 全記事に同じ8県（113東京 127大阪 126京都 101北海道 140福岡 147沖縄
 * 114神奈川 133広島）を2回ずつ置いているため、「いちばん多い県」で決めると
 * 2票で並び、先頭の東京が勝つ。長野の記事も熱海の記事も東京になっていた。
 *
 * パンくずに県が無い記事（全国もの・食べ物の記事など）は入れない ――
 * どの県のカードに出すか決まらないため。
 *
 * ---------------------------------------------------------------------------
 * 本文をどう作るか
 * ---------------------------------------------------------------------------
 * **全文は取らない。** ポップアップは「味見 → 続きはMATCHAで」の作りなので、
 * 導入の段落だけを最大4つ拾う。og:description があればそれを先頭に置く。
 * 要約は生成しない（AIは使わない ―― 0017 で外した方針のまま）。
 *
 * 段落と写真は **本文の入れ物（`article_content`）の中だけ**から拾う。
 * ページ全体の <p> を拾うと、関連記事・ランキング・広告の文言が混ざる。
 * 写真の権利表記（Picture courtesy of …）と予約サイトへの誘い文句は落とす。
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
const SQL_OUT = has('sql');
const JSON_OUT = has('json');
/** MATCHA側の言語のパス。アプリの言語札へはこの表で変換する */
const LANG = flag('lang', 'jp');
const LIMIT = Number(flag('limit', '40'));
const URLS_FILE = flag('urls');
const ORIGIN = flag('origin', 'https://matcha-jp.com');
/** 何か月ぶんの記事一覧を遡るか */
const MONTHS = Number(flag('months', '6'));
/** 県ごとの一覧から集める（47県ぜんぶを埋めたいとき） */
const BY_PREF = has('by-prefecture');
/** 県ごとに何件まで取るか */
const PER_PREF = Number(flag('per-prefecture', '3'));
/** 一覧のページを何枚めくるか */
const PAGES = Number(flag('pages', '2'));
const UA = 'my-japan-importer/1.0 (+https://www.my-japan-matcha.com)';

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

const get = (url) => fetch(url, { headers: { 'User-Agent': UA } });

// ---------------------------------------------------------------- 取り出し

/**
 * 実体参照はMATCHAの題・要約・画像URLにそのまま出てくる
 * （`&times;` `&mdash;` `&rsquo;`、URLの `&amp;` など）。
 * 取りこぼすと「『薬屋のひとりごと』&times;東京シティビュー」のまま画面に出るし、
 * 画像のURLは `&amp;` のせいで開けなくなる
 */
const NAMED = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  times: '×', hellip: '…', mdash: '—', ndash: '–', middot: '・',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  yen: '¥', deg: '°', bull: '•', copy: '©', reg: '®', trade: '™',
  euro: '€', pound: '£', frac12: '½', sup2: '²', sup3: '³',
  aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', aring: 'å', atilde: 'ã', aelig: 'æ',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oslash: 'ø',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  ntilde: 'ñ', ccedil: 'ç', szlig: 'ß',
};

/** 実体参照だけを戻す（タグには触らない ―― URLにも使う） */
const decode = (s) =>
  String(s ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);

const text = (html) =>
  decode(
    String(html ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\s+/g, ' ')
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

/** 記事の JSON-LD（Article）。題と公開日はここが一番きれい */
function jsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1].trim());
      const one = Array.isArray(d) ? d.find((x) => x['@type'] === 'Article') : d;
      if (one && one['@type'] === 'Article') return one;
    } catch {}
  }
  return null;
}

/** 本文の入れ物（`article_content`）の中身だけを切り出す */
function bodyHtml(html) {
  const open = html.match(/<div[^>]+class=["']article_content[^"']*["'][^>]*>/i);
  if (!open) return null;
  const from = open.index + open[0].length;
  // 本文の終わり。書き手の紹介 → 注記 → パンくず の順に探す
  const ends = ['writer-article-profile', 'article-disclaimer', 'c-breadcrumbs', '</main']
    .map((k) => html.indexOf(k, from))
    .filter((i) => i > 0);
  return ends.length ? html.slice(from, Math.min(...ends)) : html.slice(from);
}

/** パンくずの中の region を順に返す */
function crumbRegions(html) {
  const i = html.indexOf('c-breadcrumbs');
  if (i < 0) return [];
  const end = html.indexOf('</nav>', i);
  const crumbs = html.slice(i, end > 0 ? end : i + 4000);
  return [...crumbs.matchAll(/list\?region=(\d+)/g)].map((m) => Number(m[1]));
}

/**
 * エリアの region（148〜408）→ 県コード。
 * エリア一覧のページのパンくずが「東京都の記事一覧 > 銀座・日本橋観光ガイド」
 * となっていて、そこに県の region が入っている。一度引いたら覚えておく
 */
const areaCache = new Map();
async function prefectureOfArea(region) {
  if (areaCache.has(region)) return areaCache.get(region);
  let code = null;
  try {
    const r = await get(`${ORIGIN}/${LANG}/list?region=${region}`);
    if (r.ok) {
      for (const n of crumbRegions(await r.text())) {
        if (n - 100 >= 1 && n - 100 <= 47) { code = n - 100; break; }
      }
    }
  } catch {}
  areaCache.set(region, code);
  return code;
}

/**
 * どの県の記事か。パンくずの region だけを見る。
 * ヘッダの地域メニューは全記事共通なので数えない（先頭の解説を参照）。
 *
 * 東京の記事の多くはパンくずが県ではなく **エリア**（222=銀座・日本橋、
 * 224=渋谷・原宿・表参道 など）になっている。県だけを見ていると
 * 都心の記事がまるごと落ちるので、エリアなら県まで引き直す
 */
async function prefectureOf(html) {
  const regions = crumbRegions(html);
  for (const n of regions) {
    if (n - 100 >= 1 && n - 100 <= 47) return n - 100;
  }
  for (const n of regions) {
    if (n >= 148 && n <= 408) {
      const code = await prefectureOfArea(n);
      if (code) return code;
    }
  }
  return null;
}

/** 題。JSON-LD の headline が素のまま。無ければ og:title から社名を落とす */
function titleOf(html, ld) {
  const clean = (s) =>
    text(s ?? '')
      // 「… - 日本の観光メディアMATCHA」「… - Japan Travel Guide MATCHA」など
      .replace(/\s*[-|｜]\s*[^-|｜]*MATCHA\s*$/i, '')
      .trim();
  return (
    clean(ld?.headline) ||
    clean(meta(html, 'og:title')) ||
    clean((html.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1])
  );
}

/** 読み物にならない段落（権利表記・予約サイトへの誘い）を落とす */
const isNoise = (s) =>
  /^(picture|photo|image)s?\s+(courtesy|by|from)/i.test(s) ||
  /^(取材協力|画像提供|写真提供|撮影協力)/.test(s) ||
  /^https?:/.test(s);

/** 導入の段落を最大4つ。全文は取らない */
function bodyOf(html, description) {
  const seg = bodyHtml(html);
  const paras = [...(seg ?? '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({ html: m[1], text: text(m[1]) }))
    // 中身がほとんどリンクの段落（「プラン一覧はこちら」等）は本文ではない
    .filter((p) => text(p.html.replace(/<a[\s\S]*?<\/a>/gi, '')).length >= p.text.length * 0.6)
    .map((p) => p.text)
    .filter((s) => s.length >= 40 && !isNoise(s))
    .slice(0, 4);
  const out = [];
  if (description) out.push(description);
  paras.forEach((p) => {
    // og:description と同じ文が二度並ばないようにする
    if (!out.some((o) => o.startsWith(p.slice(0, 30)) || p.startsWith(o.slice(0, 30)))) out.push(p);
  });
  return out.slice(0, 4).join('\n\n');
}

/**
 * 本文に添える写真。og:image を先頭に、本文の中の画像を足して最大4枚。
 * ページ全体から拾うとロゴ・書き手の似顔絵・関連記事のサムネイルが混ざる。
 * `resize/{幅}x…` の幅が小さいものは飾りなので外す
 */
function imagesOf(html, ogImage) {
  const urls = [];
  const push = (raw) => {
    if (!raw || !/^https?:\/\//.test(raw)) return;
    // 画像のURLは属性のまま拾うので `&amp;` が残る。戻さないと開けない。
    // `original/` は原寸（4MB超のものがある）。同じ画像の720px版に置き換える
    const u = decode(raw).replace(/\/original\//, '/resize/720x2000/');
    if (urls.includes(u)) return;
    if (/(logo|icon|sprite|avatar|banner)/i.test(u)) return;
    const w = u.match(/\/resize\/(\d+)x/);
    if (w && Number(w[1]) < 400) return;
    urls.push(u);
  };
  for (const m of (bodyHtml(html) ?? '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
  /**
   * og:image は本文に無いときだけ使う。
   * **MATCHAは同じ写真をOGP用に別IDで上げ直していることがある**
   * （MAPPAの記事: og が 268642、本文の1枚目が 268548。絵は同一）。
   * URLも中身も違うので突き合わせでは見抜けず、ポップアップに同じ写真が
   * 2度出る。本文の写真だけを使えばこの重なりは起きない
   */
  if (!urls.length) push(ogImage);
  return urls.slice(0, 4);
}

function publishedOf(html, ld) {
  const raw = ld?.datePublished ?? meta(html, 'article:published_time') ?? meta(html, 'og:updated_time');
  return raw ? String(raw).slice(0, 10) : null;
}

// ---------------------------------------------------------------- 収集

/** `<loc>` の中身。CDATAで包まれているので剥がす */
const locsIn = (xml) =>
  [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/g)].map((m) => m[1].trim());

/**
 * 県ごとの記事一覧（`list?region={100+県コード}`）から集める。
 *
 * **sitemapの新着順だけでは県が偏る。** 直近6か月の先頭20件では
 * 東京と大阪ばかりが取れて、47県のうち17県しか埋まらなかった
 * （日本語で何か出るのは11県だけ）。県のカードは47県ぜんぶで開くので、
 * 「押しても何も出ない県」が30もあると機能そのものが無いのと同じ。
 *
 * 一覧のページは右側にランキングと新着を持っており、そこには他県の記事が
 * 並ぶ。`id="sidebar"` より前だけを見る。
 * どの県の記事かは、結局それぞれの記事のパンくずで決める（prefectureOf）ので、
 * 取りこぼしても他県の記事が混ざっても正しい県に入る。
 */
async function collectByPrefecture() {
  const host = new URL(ORIGIN).host;
  const out = [];
  const seen = new Set();
  for (let code = 1; code <= 47; code++) {
    const urls = [];
    for (let page = 1; page <= PAGES; page++) {
      const listUrl = `${ORIGIN}/${LANG}/list?region=${code + 100}${page > 1 ? `&page=${page}` : ''}`;
      try {
        const r = await get(listUrl);
        if (!r.ok) break;
        const html = await r.text();
        const head = html.slice(0, html.indexOf('id="sidebar"') + 1 || html.length);
        for (const m of head.matchAll(new RegExp(`href="https://${host}/${LANG}/(\\d+)"`, 'g'))) {
          const u = `${ORIGIN}/${LANG}/${m[1]}`;
          if (!seen.has(u) && !urls.includes(u)) urls.push(u);
        }
      } catch {}
      if (urls.length >= PER_PREF) break;
    }
    /**
     * **既出の印は「実際に取ったURL」にだけ付ける。**
     * 見つけたURL全部に付けていたら、隣県の一覧に相手の記事が並んでいる
     * ぶんまで消費され、その県の番になったときに何も残っていなかった
     * （佐賀がこれで0件になった。一覧には7件あるのに1件も取れていない）
     */
    const take = urls.slice(0, PER_PREF);
    take.forEach((u) => seen.add(u));
    out.push(...take);
    process.stdout.write(`  ${String(code).padStart(2, '0')}:${take.length}${code % 12 === 0 ? '\n' : ' '}`);
    await new Promise((s) => setTimeout(s, 250));
  }
  console.log('');
  return out;
}

async function collectUrls() {
  if (URLS_FILE) {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(URLS_FILE, 'utf8');
    return raw.split('\n').map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
  }
  if (BY_PREF) {
    console.log(`県ごとの一覧を読む（1県あたり最大 ${PER_PREF} 件）`);
    return collectByPrefecture();
  }
  const index = `${ORIGIN}/${LANG}/sitemap.xml`;
  console.log(`sitemap を読む: ${index}`);
  const r = await get(index);
  if (!r.ok) throw new Error(`sitemap が読めません (${r.status})`);

  // 月ごとの記事一覧（/{lang}/articles/YYYY-MM.xml）を新しい順に
  const months = locsIn(await r.text())
    .filter((u) => /\/articles\/\d{4}-\d{2}\.xml$/.test(u))
    .sort()
    .reverse()
    .slice(0, MONTHS);
  console.log(`記事一覧: ${months.length} か月ぶん`);

  const out = [];
  for (const m of months) {
    try {
      const rr = await get(m);
      if (!rr.ok) continue;
      out.push(...locsIn(await rr.text()));
    } catch {}
    if (out.length >= LIMIT * 3) break;
  }

  const host = new URL(ORIGIN).host;
  return out.filter((u) => {
    try {
      const x = new URL(u);
      return (
        x.host === host &&
        // 記事は /{lang}/{数字}
        new RegExp(`^/${LANG}/\\d+/?$`).test(x.pathname) &&
        !x.search
      );
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------- 本体

function insertSql(rows) {
  const values = rows
    .map(
      (r) =>
        `  (${q(r.url)}, ${q(LOCALE)}, ${r.code}, ${q(r.title)}, ${q(r.body)},` +
        ` ${q(JSON.stringify(r.images))}::jsonb, ${r.published ? q(r.published) + '::timestamptz' : 'null'})`
    )
    .join(',\n');
  return `insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
${values}
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;`;
}

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

  /** 1本ぶんの取り出し。入れられれば行を、駄目なら理由を返す */
  async function extract(url) {
    const r = await get(url);
    if (!r.ok) return { why: `HTTP ${r.status}` };
    const html = await r.text();
    const ld = jsonLd(html);

    const code = await prefectureOf(html);
    const title = titleOf(html, ld);
    // JSON-LD の中の文字列も実体参照のまま（`Nara&mdash;Japan` が出ていた）
    const description = text(ld?.description ?? '') || meta(html, 'og:description');
    const body = bodyOf(html, description);
    const images = imagesOf(html, ld?.image?.url ?? meta(html, 'og:image'));
    const published = publishedOf(html, ld);

    if (!code || !title || body.length < 60) {
      return { why: !code ? '県が特定できない' : !title ? '題が無い' : '本文が短い' };
    }
    return { row: { url, title, body, images, code, published } };
  }

  const note = (r) =>
    console.log(
      `  ok    [${String(r.code).padStart(2, '0')}] 段落${r.body.split('\n\n').length} 写真${r.images.length}  ${r.title.slice(0, 40)}`
    );

  for (const url of urls.slice(0, LIMIT)) {
    try {
      const { row, why } = await extract(url);
      if (!row) { skipped++; console.log(`  skip  ${url}  (${why})`); continue; }
      rows.push(row);
      note(row);
      // 相手のサーバに負荷をかけない
      await new Promise((s) => setTimeout(s, 400));
    } catch (e) {
      skipped++;
      console.log(`  fail  ${url}  ${e.message.slice(0, 60)}`);
    }
  }

  /**
   * 1件も取れなかった県を埋める。
   *
   * 県の一覧の先頭に、その県を扱っていても**パンくずが隣県の記事**が
   * 並ぶことがある（佐賀の一覧は九州のまとめ記事が3本続き、先頭3件を
   * 取ると全部が福岡になっていた）。取ってみるまで県が分からないので、
   * 足りなかった県だけ、一覧を深く見て当たりが出るまで引く
   */
  if (BY_PREF) {
    const have = new Set(rows.map((r) => r.code));
    const missing = Array.from({ length: 47 }, (_, i) => i + 1).filter((c) => !have.has(c));
    if (missing.length) {
      console.log(`\n1件も取れなかった県: ${missing.join(' ')} → 一覧を深く見ます`);
      const taken = new Set(rows.map((r) => r.url));
      for (const code of missing) {
        let done = false;
        for (let page = 1; page <= PAGES + 1 && !done; page++) {
          const listUrl = `${ORIGIN}/${LANG}/list?region=${code + 100}${page > 1 ? `&page=${page}` : ''}`;
          let cands = [];
          try {
            const r = await get(listUrl);
            if (!r.ok) break;
            const html = await r.text();
            const head = html.slice(0, html.indexOf('id="sidebar"') + 1 || html.length);
            for (const m of head.matchAll(new RegExp(`href="https://${new URL(ORIGIN).host}/${LANG}/(\\d+)"`, 'g'))) {
              const u = `${ORIGIN}/${LANG}/${m[1]}`;
              if (!taken.has(u) && !cands.includes(u)) cands.push(u);
            }
          } catch { break; }
          for (const u of cands.slice(0, 12)) {
            try {
              const { row } = await extract(u);
              taken.add(u);
              if (row?.code === code) { rows.push(row); note(row); done = true; break; }
            } catch {}
            await new Promise((s) => setTimeout(s, 300));
          }
        }
        if (!done) console.log(`  ${String(code).padStart(2, '0')}: 見つかりませんでした`);
      }
    }
  }

  console.log(`\n入れる: ${rows.length} 件 / 見送り: ${skipped} 件`);
  if (!rows.length) return;

  if (JSON_OUT) {
    // 取り込む前に中身を確かめたいとき（画面での見え方の確認に使う）
    console.log(
      JSON.stringify(
        rows.map((r) => ({
          id: r.url.split('/').pop(),
          url: r.url,
          lang: LOCALE,
          prefecture_code: r.code,
          title: r.title,
          body: r.body,
          images: r.images,
          published_at: r.published,
        })),
        null,
        0
      )
    );
    return;
  }

  if (SQL_OUT) {
    console.log(`\n${insertSql(rows)}`);
    return;
  }

  if (DRY) {
    console.log('\n--- 1件目の中身 ---');
    const s = rows[0];
    console.log(`県コード: ${s.code}\n題: ${s.title}\n公開: ${s.published}`);
    console.log(`写真:\n${s.images.map((u) => '  ' + u).join('\n')}`);
    console.log(`本文(段落${s.body.split('\n\n').length}):\n${s.body.slice(0, 500)}…`);
    console.log('\n--dry-run なので何も書き込んでいません（--sql でINSERT文が出ます）。');
    return;
  }

  // 同じ url+lang は入れ直す（unique 制約に合わせて upsert）
  await sql(insertSql(rows));
  console.log(`書き込みました（lang=${LOCALE}）`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
