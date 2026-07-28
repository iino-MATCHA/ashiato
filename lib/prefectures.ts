/**
 * 都道府県ID(JIS X 0401, 1..47) ↔ SVGスラッグ(mappath.ts のキー) の対応表。
 * Prefecture_master の id（1..47）と日本地図SVGを紐付けるために使う。
 * 並び順は 0002 マイグレーションの prefectures 投入順（＝JIS順）と一致。
 */

// index 0 は未使用（1始まりに合わせる）
export const PREFECTURE_SLUG_BY_ID: (string | null)[] = [
  null,
  'hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima',
  'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa',
  'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu',
  'shizuoka', 'aichi', 'mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara',
  'wakayama', 'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi',
  'tokushima', 'kagawa', 'ehime', 'kochi', 'fukuoka', 'saga', 'nagasaki',
  'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa',
];

// 英語名（Prefecture_master.prefecture_en と一致、id=prefecture_code順）
export const PREFECTURE_EN_BY_ID: (string | null)[] = [
  null,
  'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima',
  'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa',
  'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu',
  'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara',
  'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi',
  'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki',
  'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa',
];

// 御朱印スタンプに押す漢字1文字（都道府県ごと・重複しないように選定）
export const PREFECTURE_KANJI_BY_ID: (string | null)[] = [
  null,
  '北', '青', '岩', '宮', '秋', '形', '福', '茨', '栃', '群', '埼', '千', '東', '神',
  '潟', '富', '加', '越', '梨', '信', '岐', '駿', '尾', '勢', '近', '京', '浪', '摂',
  '奈', '紀', '因', '雲', '備', '芸', '防', '阿', '讃', '媛', '土', '筑', '佐', '崎',
  '熊', '豊', '日', '薩', '琉',
];

// 日本語の正式名（検索用）
export const PREFECTURE_JA_BY_ID: (string | null)[] = [
  null,
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/** クエリが都道府県名（日/英・接尾辞の有無は不問）なら code を返す。 */
export function prefectureCodeForQuery(q: string): number | null {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return null;
  for (let code = 1; code <= 47; code++) {
    const en = (PREFECTURE_EN_BY_ID[code] ?? '').toLowerCase();
    const ja = PREFECTURE_JA_BY_ID[code] ?? '';
    const jaBare = ja.replace(/[都道府県]$/, '');
    if (term === en || term === ja || term === jaBare) return code;
  }
  return null;
}

// 御朱印に筆で書く読み（ひらがな・縦書き用）
export const PREFECTURE_KANA_BY_ID: (string | null)[] = [
  null,
  'ほっかいどう', 'あおもり', 'いわて', 'みやぎ', 'あきた', 'やまがた', 'ふくしま',
  'いばらき', 'とちぎ', 'ぐんま', 'さいたま', 'ちば', 'とうきょう', 'かながわ',
  'にいがた', 'とやま', 'いしかわ', 'ふくい', 'やまなし', 'ながの', 'ぎふ',
  'しずおか', 'あいち', 'みえ', 'しが', 'きょうと', 'おおさか', 'ひょうご',
  'なら', 'わかやま', 'とっとり', 'しまね', 'おかやま', 'ひろしま', 'やまぐち',
  'とくしま', 'かがわ', 'えひめ', 'こうち', 'ふくおか', 'さが', 'ながさき',
  'くまもと', 'おおいた', 'みやざき', 'かごしま', 'おきなわ',
];

/**
 * 印影の色。HSLの虹色は彩度が高すぎて土産物のように見えるので、
 * 日本の伝統色から彩度を抑えたものだけを選んで順に割り当てる。
 */
const SEAL_COLORS = [
  '#9E3D32', // 弁柄
  '#6B4A3A', // 焦茶
  '#7B6136', // 鶯茶
  '#4F6B45', // 松葉
  '#3E5C61', // 錆浅葱
  '#3A4A6B', // 藍
  '#5B4A6B', // 二藍
  '#8A4A55', // 蘇芳
  '#7A5B2E', // 黄土
  '#4A5D4E', // 老竹
  '#6B3F4A', // 海老茶
  '#455A64', // 鉄紺
];

export function prefectureColor(id: number): string {
  return SEAL_COLORS[(id * 5) % SEAL_COLORS.length];
}

// その都道府県を象徴するオブジェクト（現在は未使用）。
export const PREFECTURE_SYMBOL_BY_ID: Record<number, string> = {};

// slug -> id 逆引き
export const PREFECTURE_ID_BY_SLUG: Record<string, number> = PREFECTURE_SLUG_BY_ID.reduce(
  (acc, slug, id) => {
    if (slug) acc[slug] = id;
    return acc;
  },
  {} as Record<string, number>
);

export function slugForPrefectureId(id: number): string | null {
  return PREFECTURE_SLUG_BY_ID[id] ?? null;
}

/** 都道府県ID配列 → SVGスラッグのSet。 */
export function slugsFromPrefectureIds(ids: Array<number | null | undefined>): Set<string> {
  const s = new Set<string>();
  ids.forEach((id) => {
    if (id == null) return;
    const slug = PREFECTURE_SLUG_BY_ID[id];
    if (slug) s.add(slug);
  });
  return s;
}

/** 都道府県名(英語 or slug) → SVGスラッグ（小文字化。'Kyoto'→'kyoto'）。 */
export function slugForName(name: string): string {
  return name.trim().toLowerCase();
}
