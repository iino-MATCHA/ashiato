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

// 御朱印スタンプに押す漢字1文字（都道府県ごと）
export const PREFECTURE_KANJI_BY_ID: (string | null)[] = [
  null,
  '北', '青', '岩', '宮', '秋', '形', '福', '茨', '栃', '群', '埼', '千', '東', '奈',
  '新', '富', '石', '井', '梨', '信', '岐', '静', '愛', '三', '滋', '京', '浪', '兵',
  '奈', '和', '鳥', '雲', '岡', '厳', '口', '徳', '讃', '媛', '土', '博', '佐', '崎',
  '熊', '豊', '崎', '薩', '琉',
];

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
