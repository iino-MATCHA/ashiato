/**
 * 県カードの「行くなら」を **場所の紹介** にする。
 *
 *   node scripts/enrich-article-spots.mjs
 *
 * 入力: supabase/seed/0027_matcha_articles_{jp,en,ko,cn,tw}.sql（取り込みの生データ）
 *       .masters/munis.json（県名の5言語表記に使う）
 * 出力: supabase/seed/articles/{lang}_NofM.sql（50件ずつ・貼って壊れない形）
 *
 * やること
 * 1) 記事の題から**主役のスポット**を Wikipedia で特定する
 *    （「福島・鶴ヶ城公園の桜の見頃は？…」→ 若松城）。
 *    候補語を題から切り出し、opensearch → summary の順に引き、
 *    **概要文にその県の名前が出てくるものだけ**を採る（他県の同名を弾く）。
 * 2) カードの札（place）はスポットの名前にする（会津若松ではなく若松城）
 * 3) MATCHAの本文が一覧・季節・イベントもの（「◯選」「桜の見頃」…）なら、
 *    本文を **Wikipedia の概要文に差し替える** ―― 初めての人に
 *    「そこがどんな場所か」が分かる文にする（指摘を受けた）。
 *    単一スポットの紹介記事（「日光東照宮の歴史・見どころ」）はそのまま。
 * 4) **写真はどちらの場合もMATCHAのまま。** 差し替えた本文には出典
 *    （Wikipedia / CC BY-SA）を持たせ、画面の下に小さく出す
 *
 * 都道府県そのものの概要には差し替えない（県カードの上に紹介文が既にある）。
 * Wikipedia が引けなかった記事は、いままでどおりMATCHAの本文と地名のまま。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const UA = 'MyJapanBot/1.0 (+https://www.my-japan-matcha.com; iino@matcha-jp.com)';
const LANGS = [
  ['jp', 'ja', 'ja', 'prefecture_ja', 'municipality_ja'],
  ['en', 'en', 'en', 'prefecture_en', 'municipality_en'],
  ['ko', 'ko', 'ko', 'prefecture_ko', 'municipality_ko'],
  ['cn', 'zh-Hans', 'zh', 'prefecture_zh_hans', 'municipality_zh_hans'],
  ['tw', 'zh-Hant', 'zh', 'prefecture_zh_hant', 'municipality_zh_hant'],
];

// ---------------------------------------------------------------- 入力

/** 0027_..._{L}.sql の values を読み戻す（'' の逃がしを見ながら） */
function rowsOf(sql) {
  const body = sql.split('values')[1].split('\non conflict')[0];
  const out = [];
  let i = 0;
  while (true) {
    const k = body.indexOf("\n  ('https", i);
    if (k < 0) break;
    const vals = [];
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

// ---------------------------------------------------------------- 候補語

const STOP_JA = /^(観光|スポット|名所|グルメ|ホテル|ランキング|見頃|紅葉|イベント|まとめ|完全|徹底|紹介|開花|時期|日程|場所|情報|人気|おすすめ|オススメ|定番|穴場|絶景|絶品|旅行|日帰り|モデルコース|見どころ|楽しみ方|歴史|魅力|世界遺産|春|夏|秋|冬|花見|食べ歩き|ライトアップ)$/;
/** スポットの名前らしい語尾。これで終わる候補を先に試す */
const SPOT_TAIL = /(城|寺|宮|神社|大社|稲荷|公園|温泉|渓谷|峡|湖|沼|山|岳|岬|滝|島|湾|海岸|浜|水族館|美術館|博物館|動物園|庭園|園|街道|宿|横丁|通り|市場|市|町|村|区|Castle|Shrine|Temple|Park|Onsen|Gorge|Lake|Falls|Island|Museum|Aquarium|Garden|Bay|Beach|성|사|궁|신사|공원|온천|호수|산|섬|시|정|박물관|미술관|수족관)$/i;

function candidatesCjk(title) {
  const t = title
    .replace(/【[^】]*】|\[[^\]]*\]|（[^）]*）|\([^)]*\)/g, ' ')
    .replace(/\d{4}(?:年)?/g, ' ');
  const segs = t.split(/[・、。，,｜|！!？?：:；;／\/「」『』《》〈〉\s〜～—–-]+/).filter(Boolean);
  const out = [];
  for (const seg of segs) {
    const parts = seg.split(/(?:の|を|に|へ|が|で|は|と|や|から|まで|より|的|之|와|과|의|에서|으로|로)(?=.)/);
    for (const c of [seg, ...parts]) {
      let w = c.trim();
      if (!w) continue;
      // 「◯◯まつり」→「◯◯」も足す（竿燈まつり → 竿燈）
      const trimmed = w.replace(/(まつり|祭り|フェス|축제)$/,'');
      for (const v of new Set([w, trimmed])) {
        if (v.length >= 2 && v.length <= 14 && !/^\d+/.test(v) && !STOP_JA.test(v)) out.push(v);
      }
    }
  }
  return rank([...new Set(out)]);
}

function candidatesEn(title) {
  const stops = new Set(['The','A','An','Best','Top','Guide','Japan','Japanese','Complete','Ultimate','How','What','Where','New','Great','Station','Hotel','Hotels','Access','Near','Nearby','Trip','Trips','Travel','Tips','Things','Do','To','And','Of','In','At','From','For','With','Your','This','These','Autumn','Spring','Summer','Winter']);
  const runs = title.match(/[A-Z][\w'’&.-]*(?:\s+(?:of|the|no|de|la)?\s*[A-Z][\w'’&.-]*)*/g) ?? [];
  const out = [];
  for (const r of runs) {
    const words = r.split(/\s+/).filter((w) => !stops.has(w.replace(/[^\w]/g, '')));
    if (!words.length) continue;
    const c = words.join(' ').trim();
    if (c.length >= 3 && c.length <= 40) out.push(c);
  }
  return rank([...new Set(out)]);
}

/** スポットらしい語尾を先に、かな・機能語まみれを後に、同点は長い方 */
function rank(cands) {
  const score = (c) => {
    const tail = SPOT_TAIL.test(c) ? 0 : 1;
    const kanaRatio = (c.match(/[ぁ-ん]/g) ?? []).length / c.length;
    return [tail, kanaRatio > 0.4 ? 1 : 0, -c.length];
  };
  return cands.sort((a, b) => {
    const x = score(a), y = score(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  });
}

// ---------------------------------------------------------------- Wikipedia

const CACHE_PATH = '.masters/wiki-cache.json';
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};
let cacheDirty = 0;
const saveCache = () => writeFileSync(CACHE_PATH, JSON.stringify(cache));

async function wiki(lang, variant, cand) {
  const key = `${lang}:${variant}:${cand}`;
  if (key in cache) return cache[key];
  let out = null;
  try {
    const os = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cand)}&limit=1&redirects=resolve&format=json`,
      { headers: { 'User-Agent': UA } }
    ).then((r) => r.json());
    const page = os?.[1]?.[0];
    if (page) {
      const s = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`,
        { headers: { 'User-Agent': UA, 'Accept-Language': variant } }
      ).then((r) => r.json());
      if (s && s.type === 'standard' && s.extract && s.extract.length >= 80) {
        out = { spot: s.title, extract: s.extract, url: s.content_urls?.desktop?.page ?? null };
      }
    }
  } catch {}
  cache[key] = out;
  if (++cacheDirty % 25 === 0) saveCache();
  await new Promise((r) => setTimeout(r, 120));
  return out;
}

// ---------------------------------------------------------------- 差し替えの判断

/** 一覧・季節・イベントもの ―― 単一スポットの概要ではない題 */
const NOT_SPOT_OVERVIEW =
  /\d+\s*選|\d+選|ランキング|まとめ|モデルコース|エリア別|日帰り|卒業旅行|デート|見頃|開花|桜|紅葉|ライトアップ|イベント|まつり|祭り|花火|雪まつり|best|top\s*\d+|itinerary|day trip|events?|cherry|blossom|foliage|illuminat|festival|추천|명소 \d|코스|벚꽃|단풍|축제|이벤트|불꽃|排行|推荐|推薦|攻略|活动|活動|樱|櫻|红叶|紅葉|盘点|盤點|必去|选|選/i;

// ---------------------------------------------------------------- 出力

const e = (v) =>
  v === null || v === undefined
    ? 'null'
    : `E'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r\n?|\n/g, '\\n')}'`;

const HEAD =
  'insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at, place, text_attribution, text_attribution_url)\nvalues\n';
const TAIL = `on conflict (url, lang) do update set
prefecture_code = excluded.prefecture_code,
title = excluded.title,
body = excluded.body,
images = excluded.images,
published_at = excluded.published_at,
place = excluded.place,
text_attribution = excluded.text_attribution,
text_attribution_url = excluded.text_attribution_url;
`;

// ---------------------------------------------------------------- 本体

const munis = JSON.parse(await readFile('.masters/munis.json', 'utf8'));
const areas = JSON.parse(await readFile('.masters/areas.json', 'utf8'));
await mkdir('supabase/seed/articles', { recursive: true });

/** 県コード → その言語での県名・市区町村名（概要文の検証に使う） */
function keywordsFor(code, prefCol, muniCol) {
  const rows = munis.filter((m) => m.prefecture_code === code);
  const pref = rows[0]?.[prefCol] ?? '';
  const prefJa = rows[0]?.prefecture_ja ?? '';
  const base = pref.replace(/ Prefecture$/,'').replace(/[都道府県]$/u,'');
  const ms = rows.slice(0, 40).flatMap((m) => [m[muniCol], m.municipality_ja]).filter(Boolean);
  return [...new Set([pref, base, prefJa, prefJa.replace(/[都道府県]$/u,''), ...ms])].filter((k) => k && k.length >= 2);
}

let totals = { rows: 0, spot: 0, swapped: 0 };
for (const [L, locale, wikiLang, prefCol, muniCol] of LANGS) {
  const sql = await readFile(`supabase/seed/0027_matcha_articles_${L}.sql`, 'utf8');
  const rows = rowsOf(sql);
  const variant = locale === 'zh-Hans' ? 'zh-hans' : locale === 'zh-Hant' ? 'zh-hant' : locale;

  for (const row of rows) {
    const keywords = keywordsFor(row.code, prefCol, muniCol);
    const prefNames = new Set(keywordsFor(row.code, prefCol, muniCol).slice(0, 4));
    const cands = (locale === 'en' ? candidatesEn(row.title) : candidatesCjk(row.title))
      // 県名そのものは引かない（県の紹介文はカードの上に既にある）
      .filter((c) => !prefNames.has(c))
      .slice(0, 8);

    let hit = null;
    let hitCand = null;
    for (const c of cands) {
      const w = await wiki(wikiLang, variant, c);
      if (w && keywords.some((k) => w.extract.includes(k))) { hit = w; hitCand = c; break; }
    }

    // 地名の控え（Wikipediaが引けないときは今までどおりエリア/市区町村）
    let fallbackPlace = null;
    {
      const nameCol = { ja: 'name_ja', en: 'name_en', ko: 'name_ko', 'zh-Hans': 'name_zh_hans', 'zh-Hant': 'name_zh_hant' }[locale];
      for (const a of areas) {
        if (a.prefecture_code !== row.code) continue;
        const n = a[nameCol];
        if (n && (row.title.includes(n) || row.title.includes(a.name_ja ?? '') || row.body.includes(n))) { fallbackPlace = n; break; }
      }
      if (!fallbackPlace) {
        for (const m of munis) {
          if (m.prefecture_code !== row.code) continue;
          const n = m[muniCol];
          const bare = (m.municipality_ja ?? '').replace(/[市区町村]$/u, '');
          if (n && (row.title.includes(n) || (bare.length >= 2 && row.title.includes(bare)))) { fallbackPlace = n; break; }
        }
      }
    }

    if (hit) {
      totals.spot++;
      // 札はスポットの名前（曖昧さ回避の括弧は落とす）
      row.place = hit.spot.replace(/\s*[（(][^）)]*[）)]$/u, '');
      const swap = NOT_SPOT_OVERVIEW.test(row.title);
      if (swap) {
        totals.swapped++;
        row.title = row.place;
        row.body = hit.extract;
        row.attribution = 'Wikipedia (CC BY-SA 4.0)';
        row.attributionUrl = hit.url;
      }
      if (!swap) { row.attribution = null; row.attributionUrl = null; }
    } else {
      row.place = fallbackPlace;
      row.attribution = null;
      row.attributionUrl = null;
    }
    totals.rows++;
    if (totals.rows % 25 === 0) console.log(`  …${totals.rows} 件（スポット特定 ${totals.spot} / 差し替え ${totals.swapped}）`);
  }

  const PER = 50;
  const parts = Math.ceil(rows.length / PER);
  for (let p = 0; p < parts; p++) {
    const chunk = rows.slice(p * PER, (p + 1) * PER);
    const values = chunk
      .map(
        (r) =>
          `(${e(r.url)}, ${e(locale)}, ${r.code}, ${e(r.title)}, ${e(r.body)}, ${e(JSON.stringify(r.images))}::jsonb, ${
            r.published ? `${e(r.published)}::timestamptz` : 'null'
          }, ${e(r.place)}, ${e(r.attribution)}, ${e(r.attributionUrl)})`
      )
      .join(',\n');
    await writeFile(`supabase/seed/articles/${L}_${p + 1}of${parts}.sql`, HEAD + values + '\n' + TAIL);
  }
  const sp = rows.filter((r) => r.attribution || (r.place && !NOT_SPOT_OVERVIEW.test(r.title))).length;
  console.log(`${L}: ${rows.length}件 → スポット札 ${rows.filter((r) => r.place).length} / Wikipedia差し替え ${rows.filter((r) => r.attribution).length}`);
}
saveCache();
console.log(`\n合計 ${totals.rows} 件 / スポット特定 ${totals.spot} / 本文差し替え ${totals.swapped}`);
