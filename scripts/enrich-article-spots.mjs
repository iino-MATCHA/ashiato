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
 *    候補語を題から切り出して opensearch → 導入節(exintro) と引き、
 *    **座標を持つ**ページだけを場所として採る。さらに
 *    概要文にその県の名前が出てくるものだけに絞る（他県の同名を弾く）。
 * 2) カードの札(place)と題を、そのスポットの名前にする（会津若松 → 若松城）
 * 3) **既定で本文を Wikipedia の導入節に差し替える。** 初めての人が
 *    「そこがどんな場所か」を読めることを最優先にする（指摘を受けた）。
 *    MATCHAの記事がそのスポットそのものの紹介になっているときだけ、
 *    MATCHAの本文を残す（matchaIsOverviewOf）。
 * 4) **写真はどちらの場合もMATCHAのまま。** 差し替えた本文には出典
 *    （Wikipedia / CC BY-SA）を持たせ、画面の下に小さく出す
 *
 * 出さないもの:
 *  ・自治体そのもののページ（「函館市は…にある市。中核市に指定され…」）
 *  ・駅・宿・企業・人物・作品のページ
 *  ・場所を確かめられなかった記事（札を付けず、県カードの並びに出さない）
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
/**
 * **市・町・村・区で終わる語をここに入れない。**
 * 入れていたときは自治体のページが最優先で当たり、本文が
 * 「会津若松市は福島県会津地方東部にある市。計量特定市に指定されている」
 * のような役所の説明になった。旅の役に立たない（実測）。
 */
const SPOT_TAIL = /(城|寺|院|宮|神社|大社|稲荷|公園|温泉|渓谷|峡|湖|沼|池|山|岳|峠|岬|滝|桜|島|湾|海岸|浜|砂丘|高原|牧場|水族館|美術館|博物館|動物園|庭園|園|街道|宿|横丁|通り|市場|タワー|橋|門|塔|坂|岩|洞|祭|まつり|花火|大仏|城下町|Castle|Shrine|Temple|Park|Onsen|Gorge|Lake|Falls|Island|Museum|Aquarium|Garden|Bay|Beach|Tower|Bridge|Dunes|Festival|성|사|궁|신사|공원|온천|호수|산|섬|박물관|미술관|수족관|축제)$/i;

function candidatesCjk(title) {
  const t = title
    .replace(/【[^】]*】|\[[^\]]*\]|（[^）]*）|\([^)]*\)/g, ' ')
    .replace(/\d{4}(?:年)?/g, ' ');
  // & ＆ ＋ を区切りに入れる。入れていなかったときは「紅葉&桜」が
  // ひとつの候補になり、清水寺の記事から皇居の養蚕施設を引いていた
  const segs = t.split(/[・、。，,｜|！!？?：:；;／\/＆&＋+＝=「」『』《》〈〉\s〜～—–-]+/).filter(Boolean);
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


/**
 * 本文の書き出しから行き先を拾う。
 *
 * 題に場所が出ていない一覧記事（「函館の観光スポット27選」）でも、
 * 書き出しには「五稜郭、八幡坂、函館山といった絶景」と具体の名前が
 * 並んでいる。**題で決まらなかったときだけ**ここを見る。
 * よく出てくる名前を先に試す（記事の主役に近い）。
 */
const BODY_SPOT =
  /[一-龥ヶヵ々〆ァ-ヴー]{1,10}(城|寺|神社|大社|稲荷|公園|温泉|渓谷|峡|湖|沼|山|岳|峠|岬|滝|島|湾|海岸|浜|砂丘|高原|牧場|水族館|美術館|博物館|動物園|庭園|坂|橋|門|塔|市場|横丁|タワー|大仏)/g;

function candidatesFromBody(body, locale) {
  const head = body.slice(0, 600);
  if (locale === 'en') return candidatesEn(head).slice(0, 4);
  const counts = new Map();
  for (const m of head.matchAll(BODY_SPOT)) {
    const v = m[0];
    if (v.length < 3 || v.length > 12) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v).slice(0, 4);
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

/**
 * 引いた結果の控え。**版を鍵に混ぜる** ―― 選び方を変えたのに古い判定が
 * 残ると、直したはずの記事がそのまま出てしまう
 */
const CACHE_V = 'v7';
const CACHE_PATH = '.masters/wiki-cache.json';
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};
let cacheDirty = 0;
const saveCache = () => writeFileSync(CACHE_PATH, JSON.stringify(cache));

/**
 * Wikipedia は続けて叩くと "You are making too many requests" を返す。
 * **これを「見つからなかった」として控えに残してはいけない。**
 * 一度そう覚えると、次に回しても同じ記事が永遠に見送りになる
 * （スポットが1割ほどしか決まらなかった原因がこれ）。
 * 詰まったら間を空けて引き直し、それでも駄目なら控えを残さず諦める。
 */
async function getJson(url, headers) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 429 || r.status >= 500) throw new Error(`status ${r.status}`);
      const text = await r.text();
      if (/^\s*(You are making too many|Too Many)/i.test(text)) throw new Error('rate limited');
      return JSON.parse(text);
    } catch (err) {
      if (i === 3) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
}


/**
 * 都道府県名。**munis.json は市区町村しか持っていない** ―― ここを
 * `m.prefecture_ja` で引こうとして undefined になっており、
 * 「概要にその県の名前が出てくるか」の照合が市区町村名だけ、しかも
 * 先頭40件だけで走っていた（三春滝桜が福島の記事から見つからなかった原因。
 * 三春町は福島県の41番目以降にある）。lib/prefectures.ts と同じ並び。
 */
const PREF_JA = [null,
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
const PREF_EN = [null,
  'Hokkaido','Aomori','Iwate','Miyagi','Akita','Yamagata','Fukushima',
  'Ibaraki','Tochigi','Gunma','Saitama','Chiba','Tokyo','Kanagawa',
  'Niigata','Toyama','Ishikawa','Fukui','Yamanashi','Nagano','Gifu',
  'Shizuoka','Aichi','Mie','Shiga','Kyoto','Osaka','Hyogo','Nara',
  'Wakayama','Tottori','Shimane','Okayama','Hiroshima','Yamaguchi',
  'Tokushima','Kagawa','Ehime','Kochi','Fukuoka','Saga','Nagasaki',
  'Kumamoto','Oita','Miyazaki','Kagoshima','Okinawa'];

/**
 * 自治体そのもののページ（「函館市」「福島県」）を弾くための名前の集合。
 * 一行説明での見分けは表記の揺れに弱かったので、**手持ちのマスタと
 * 突き合わせる**。言語ごとに作り直す
 */
let adminNames = new Set();

/** 地方の名前。県カードの行き先としては大きすぎる */
const REGION_NAMES = new Set([
  '北海道地方', '東北', '東北地方', '関東', '関東地方', '中部', '中部地方',
  '北陸', '北陸地方', '東海', '東海地方', '近畿', '近畿地方', '関西',
  '中国地方', '四国', '四国地方', '九州', '九州地方', '本州', '沖縄諸島',
  '南西諸島', '日本', '西日本', '東日本',
]);

/**
 * 場所として出してはいけないページ。
 * 宿・飲食店・企業・人物・作品を弾く（「宇都宮グルメの名店10選」から
 * 「宇都宮グランドホテル」を引いてしまった実績がある）。
 * **駅も弾く。** 「元町中華街」を引くと横浜高速鉄道の駅の説明が出て、
 * 「副名称は山下公園。駅番号はMM06」という、街の紹介にならない文になる
 * （アクセスの記事ばかりだという指摘と同じ形の失敗）。
 */
const NOT_A_PLACE_TITLE = /駅$|停留所|停留場|インターチェンジ|空港$|飛行場|災害$|土石流|地震$|噴火|事故$|球場|スタジアム|アリーナ|体育館|図書館|市役所|役場|刑務所|スケートパーク|地方$|高等学校|中学校|小学校|専門学校|学園|学院|大学$|ホテル|旅館|ホステル|ゲストハウス|株式会社|有限会社|Station$|Airport$|High School|University$|College$|Hotel|Inn |Resort|Restaurant|호텔|여관|역$|공항$|고등학교|酒店|飯店|車站$|機場$|高中$/i;
const NOT_A_PLACE_DESC = /の駅|鉄道の駅|の空港|学校|学園|大学|災害|土砂|地震|噴火|野球場|図書館|地方$|地域$|会社|企業|グループ|人物|政治家|俳優|歌手|漫画|アニメ|楽曲|アルバム|映画|テレビ番組|小説|バンド|事件|school|university|college|airport|railway station|train station|company|corporation|band|album|film|manga|anime|singer|actor|politician|기업|회사|가수|배우|公司|企業|歌手|演員|漫画|動画/i;

/**
 * **自治体そのもののページを弾く。**
 * Wikipedia の一行説明（description）で見分ける ―― 「福島県の市」は自治体、
 * 「福島県会津若松市にあった城」はスポット。自治体の概要は
 * 「県庁所在地であり、中核市、保健所政令市…」という役所の説明になり、
 * 初めての人が読みたい「どんなところか」にならない。
 * 市区町村を出したい記事は、地名の札だけ付けてMATCHAの本文のまま出す。
 */
const ADMIN_DESC = /の(市|町|村|区|郡)$|^(市|町|村|区)$|地方公共団体|(city|town|village|ward|municipality) (in|of) |prefecture of|일본의 (시|정|촌)|日本.{0,4}的(市|町|鎮)/i;

/**
 * 概要の文字数。**要約(summary)ではなく導入節(exintro)を採る。**
 * summary は1〜2文しか返らないことがあり（「鶴ヶ城は…城である。」で終わる）、
 * 初めての人には土地が伝わらなかった。導入節なら成り立ちや別名まで入る。
 */
const MAX_BODY = 700;

/** 導入節を2文ずつの段落に組み直す（写真を段落の脇に差し込むため） */
function paragraphize(text) {
  const flat = text.replace(/\s*\n+\s*/g, ' ').trim();
  const sentences = flat.match(/[^。！？.!?]+[。！？]|[^.!?]+[.!?](?:\s|$)|[^。！？.!?]+$/g) ?? [flat];
  const out = [];
  let buf = '';
  let used = 0;
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if (used + t.length > MAX_BODY) break;
    used += t.length;
    buf += t;
    // 2文で1段落。3段落まで（ポップアップの写真は最大4枚）
    if (buf.length >= 60 && out.length < 3) { out.push(buf); buf = ''; }
  }
  if (buf) out.push(buf);
  return out.filter(Boolean).join('\n\n');
}


/**
 * 引いてきたページが、その候補語の話をしているか。
 *
 * 候補と関係のないページに当たることがある（「熱海」→ 土石流災害、
 * 「紅葉&桜」→ 皇居の養蚕施設）。**候補の芯が、ページの見出しか
 * 書き出しに出てくること**を条件にする。
 * 「鶴ヶ城公園」→「若松城」のように名前が変わる場合も、書き出しに
 * 「別名鶴ヶ城」と出るので拾える。
 */
function isAbout(cand, title, extract) {
  const core = cand.replace(/(公園|まつり|祭り|祭|周辺|エリア|温泉郷)$/u, '');
  const needle = core.length >= 2 ? core : cand;
  return title.includes(needle) || extract.slice(0, 120).includes(needle);
}

async function wiki(lang, variant, cand) {
  const key = `${CACHE_V}:${lang}:${variant}:${cand}`;
  if (key in cache) return cache[key];
  let out = null;
  try {
    /**
     * **候補1件で打ち切らない。** 「会津若松」の先頭は市のページ、
     * 2番目が駅…と、上から順に落ちることがある。3件まで見て、
     * 場所として通った最初のものを採る
     */
    const os = await getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cand)}&limit=3&redirects=resolve&format=json`,
      { 'User-Agent': UA }
    );
    for (const page of os?.[1] ?? []) {
      // 自治体・都道府県の名前そのものは引くまでもない
      if (adminNames.has(page)) continue;
      const j = await getJson(
        `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts%7Ccoordinates%7Cdescription%7Clanglinks` +
          `&exintro=1&explaintext=1&redirects=1&lllang=ja&lllimit=1` +
          `&format=json&formatversion=2&titles=${encodeURIComponent(page)}`,
        { 'User-Agent': UA, 'Accept-Language': variant }
      );
      const p = j?.query?.pages?.[0];
      /**
       * **座標を持つページだけを場所として採る。**
       * これだけで「ふるさと創生事業」のような制度・概念のページが落ちる。
       * そのうえで宿・駅・企業・人物・自治体を題と説明で弾く
       */
      if (
        p && !p.missing && p.extract && p.extract.length >= 80 &&
        p.coordinates?.length &&
        // 転送でたどり着いた先が自治体でも弾く（「福島の桜」→「福島県」）
        !adminNames.has(p.title) && !REGION_NAMES.has(p.title) &&
        !NOT_A_PLACE_TITLE.test(p.title) &&
        isAbout(cand, p.title, p.extract) &&
        !ADMIN_DESC.test(p.description ?? '') &&
        !NOT_A_PLACE_DESC.test(`${p.description ?? ''} ${p.extract.slice(0, 140)}`)
      ) {
        out = {
          spot: p.title,
          extract: paragraphize(p.extract),
          // 日本語版の見出し。韓国語・中国語の記事を裏取りするのに使う
          jaTitle: p.langlinks?.[0]?.title ?? null,
          url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        };
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }
  } catch {}
  cache[key] = out;
  if (++cacheDirty % 25 === 0) saveCache();
  await new Promise((r) => setTimeout(r, 200));
  return out;
}


/**
 * 日本語版の導入節。
 *
 * 「その県の記事か」の裏取りに使う。韓国語・中国語版の概要には
 * 「후쿠시마현」「福岛县」と書かれていて、手持ちの県名（漢字の福島県）とは
 * 字が違うため突き合わせられない。**日本語版に渡って確かめる。**
 * これをやらないと ko/cn/tw だけスポットが3分の1しか決まらなかった。
 */
async function jaExtract(title) {
  const key = `${CACHE_V}:jaext:${title}`;
  if (key in cache) return cache[key];
  let out = null;
  try {
    const j = await getJson(
      `https://ja.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1` +
        `&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`,
      { 'User-Agent': UA }
    );
    const p = j?.query?.pages?.[0];
    if (p && !p.missing && p.extract) out = p.extract;
  } catch {}
  cache[key] = out;
  if (++cacheDirty % 25 === 0) saveCache();
  await new Promise((r) => setTimeout(r, 200));
  return out;
}

// ---------------------------------------------------------------- 差し替えの判断

/** 一覧・季節・イベントもの ―― 単一スポットの概要ではない題 */
const NOT_SPOT_OVERVIEW =
  /\d+\s*選|\d+選|ランキング|まとめ|モデルコース|エリア別|日帰り|卒業旅行|デート|見頃|開花|桜|紅葉|ライトアップ|イベント|まつり|祭り|花火|雪まつり|best|top\s*\d+|itinerary|day trip|events?|cherry|blossom|foliage|illuminat|festival|추천|명소 \d|코스|벚꽃|단풍|축제|이벤트|불꽃|排行|推荐|推薦|攻略|活动|活動|樱|櫻|红叶|紅葉|盘点|盤點|必去|选|選/i;

/**
 * **MATCHAの本文をそのまま使ってよいか。**
 *
 * 判断の向きを逆にした。以前は「一覧・季節ものの題だけ差し替える」で、
 * 153件のうち差し替わったのは2件しかなく、残りは行き方や催しの案内のまま
 * だった（「会津若松を押したら鶴ヶ城公園の桜の見頃の記事が出る」という
 * 指摘の中身がこれ）。**既定は概要に差し替え**、MATCHAの記事が
 * そのスポットそのものの紹介になっているときだけ残す。
 *
 * 残す条件は3つとも満たすこと:
 *   ・題に一覧・季節・催しの言葉が無い
 *   ・題にスポットの名前が入っている（「日光東照宮の見どころ」）
 *   ・書き出しからスポットの話をしている（本文の頭1/3に名前が出る）
 */
function matchaIsOverviewOf(row, spot) {
  if (NOT_SPOT_OVERVIEW.test(row.title)) return false;
  // 「若松城」「鶴ヶ城」など、括弧や中黒を落とした芯で照合する
  const core = spot.replace(/\s*[（(][^）)]*[）)]\s*$/u, '').replace(/[・\s]/g, '');
  if (core.length < 2) return false;
  const flatTitle = row.title.replace(/[・\s]/g, '');
  if (!flatTitle.includes(core)) return false;
  const head = row.body.replace(/[・\s]/g, '').slice(0, Math.max(200, row.body.length / 3));
  return head.includes(core);
}

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

/**
 * 県コード → 「その県の記事だ」と確かめるための語。
 * その言語の市区町村名を**全部**（40件で切らない）と、県名を日本語・英語で。
 */
function keywordsFor(code, muniCol) {
  const rows = munis.filter((m) => m.prefecture_code === code);
  const ja = PREF_JA[code] ?? '';
  const en = PREF_EN[code] ?? '';
  const ms = rows.flatMap((m) => [m[muniCol], m.municipality_ja]).filter(Boolean);
  return [...new Set([ja, ja.replace(/[都道府県]$/u, ''), en, ...ms])].filter((k) => k && k.length >= 2);
}

/** 日本語で確かめるための語（ko/zh の記事を裏取りするのに使う） */
const keywordsJaFor = (code) => keywordsFor(code, 'municipality_ja');

/**
 * --lang jp  … その言語だけ回す（確かめるとき用）
 * --verbose  … 1件ずつ「題 → 採った場所」を出す
 * --dry-run  … SQLを書かない
 */
const argv = process.argv.slice(2);
const argOf = (n) => { const i = argv.indexOf(n); return i < 0 ? null : argv[i + 1]; };
const only = argOf('--lang');
const VERBOSE = argv.includes('--verbose');
const DRY = argv.includes('--dry-run');

let totals = { rows: 0, spot: 0, swapped: 0 };
for (const [L, locale, wikiLang, prefCol, muniCol] of LANGS) {
  if (only && L !== only) continue;
  const sql = await readFile(`supabase/seed/0027_matcha_articles_${L}.sql`, 'utf8');
  const rows = rowsOf(sql);
  const variant = locale === 'zh-Hans' ? 'zh-hans' : locale === 'zh-Hant' ? 'zh-hant' : locale;

  /**
   * この言語での「自治体の名前」全部。1,741の市区町村と47の都道府県。
   * 日本語名も混ぜる（Wikipediaの見出しは日本語のことがある）
   */
  adminNames = new Set();
  for (const m of munis) {
    for (const v of [m[muniCol], m.municipality_ja]) if (v) adminNames.add(v);
  }
  for (let c = 1; c <= 47; c++) {
    for (const v of [PREF_JA[c], PREF_EN[c], `${PREF_EN[c]} Prefecture`]) if (v) adminNames.add(v);
  }

  for (const row of rows) {
    const origTitle = row.title;
    const keywords = keywordsFor(row.code, muniCol);
    const keywordsJa = keywordsJaFor(row.code);
    // 県名そのものは候補から外す（県の紹介文はカードの上に既にある）
    const prefNames = new Set([PREF_JA[row.code], PREF_JA[row.code]?.replace(/[都道府県]$/u, ''), PREF_EN[row.code]].filter(Boolean));
    const cands = (locale === 'en' ? candidatesEn(row.title) : candidatesCjk(row.title))
      // 県名そのものは引かない（県の紹介文はカードの上に既にある）
      .filter((c) => !prefNames.has(c))
      .slice(0, 10);

    /**
     * 候補を全部引いて、**いちばん具体的な当たり**を採る。
     * 先頭で打ち切ると「三春滝桜」のように語尾が変わったスポットを
     * 取りこぼす（桜で終わるので優先度が下がっていた）。
     * 同じくらいなら、候補語が長い＝細かい方を採る
     */
    /** 候補をひと通り引いて、当たりを探す */
    const lookup = async (list) => {
      let best = null;
      let bestLen = -1;
      for (const c of list) {
        const w = await wiki(wikiLang, variant, c);
        if (!w) continue;
        // 日本語版の見出しが自治体なら、その言語で通っていても採らない
        if (w.jaTitle && adminNames.has(w.jaTitle)) continue;
        let ok = keywords.some((k) => w.extract.includes(k));
        if (!ok && wikiLang !== 'ja' && w.jaTitle) {
          const jx = await jaExtract(w.jaTitle);
          ok = !!jx && keywordsJa.some((k) => jx.includes(k));
        }
        if (!ok) continue;
        if (c.length > bestLen) { best = w; bestLen = c.length; }
        // 候補はスポットらしい語尾から並べてある。そこで当たったら打ち切る
        // （全候補を引くと1件あたり30往復になり、5言語で1時間を超えた）
        if (SPOT_TAIL.test(c)) break;
      }
      return best;
    };

    let hit = await lookup(cands);
    // 題で決まらなければ本文の書き出しを見る
    if (!hit) hit = await lookup(candidatesFromBody(row.body, locale));


    /**
     * **場所を確かめられなかった記事は、県カードの「行くなら」に出さない。**
     * 以前はここで市区町村名を当てて札にしていたが、
     * 「札幌市」の下にラーメン28選、「青森市」の下に桜の名所7選…と、
     * 行き先の一覧に読み物が混ざる形になっていた（要約が雑だという
     * 指摘の中身）。**札は Wikipedia で土地だと確かめられたものだけ。**
     * 記事そのものはDBに残るので、消えるのは並びからだけ。
     * 空いたぶんは観光エリアのカード（MATCHAへのリンク）が埋める。
     */

    /**
     * **市区町村そのものの概要には差し替えない。**
     * 「福島市は福島県中通りの北部に位置する市。県庁所在地であり、中核市、
     * 保健所政令市…」のような行政の説明になり、旅の役に立たない（実測）。
     * 具体のスポットが決まらなかった一覧記事は、MATCHAの本文のまま出す ――
     * 一覧でも旅向けの文章にはなっている
     */
    if (hit) {
      totals.spot++;
      // 札はスポットの名前（曖昧さ回避の括弧は落とす）
      row.place = hit.spot.replace(/\s*[（(][^）)]*[）)]$/u, '');
      if (matchaIsOverviewOf(row, hit.spot)) {
        // MATCHAの記事がそのスポットの紹介そのもの。文も題もそのまま
        row.attribution = null;
        row.attributionUrl = null;
      } else {
        totals.swapped++;
        row.title = row.place;
        row.body = hit.extract;
        row.attribution = 'Wikipedia (CC BY-SA 4.0)';
        row.attributionUrl = hit.url;
      }
    } else {
      row.place = null;
      row.attribution = null;
      row.attributionUrl = null;
    }
    totals.rows++;
    if (VERBOSE) {
      console.log(
        `${hit ? (row.attribution ? '◎概要' : '○そのまま') : '　見送り'}  ` +
          `[${row.place ?? '-'}]  ${origTitle.slice(0, 46)}`
      );
    } else if (totals.rows % 25 === 0) {
      console.log(`  …${totals.rows} 件（スポット特定 ${totals.spot} / 差し替え ${totals.swapped}）`);
    }
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
    if (!DRY) await writeFile(`supabase/seed/articles/${L}_${p + 1}of${parts}.sql`, HEAD + values + '\n' + TAIL);
  }
  console.log(
    `${L}: ${rows.length}件 → スポット札 ${rows.filter((r) => r.place).length}` +
      ` / 概要に差し替え ${rows.filter((r) => r.attribution).length}` +
      ` / MATCHAのまま ${rows.filter((r) => r.place && !r.attribution).length}`
  );
}
saveCache();
console.log(`\n合計 ${totals.rows} 件 / スポット特定 ${totals.spot} / 本文差し替え ${totals.swapped}`);
