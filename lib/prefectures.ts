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

// 都道府県ごとの色（御朱印を彩る。id からHSLで決定的に生成）
export function prefectureColor(id: number): string {
  const hue = (id * 47) % 360;
  return `hsl(${hue}, 52%, 42%)`;
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
