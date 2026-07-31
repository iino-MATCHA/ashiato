/**
 * My Japan — デザイン言語「墨と朱」
 * -----------------------------------------------------------------
 * 箱・カードを多用せず、余白・極細罫線・大きな明朝体で構成する編集的スタイル。
 * 色は washi(和紙) を地に、藍(indigo) を構造色、朱(vermilion) を差し色として最小限に使う。
 */
import { Platform, StyleSheet } from 'react-native';

const light = {
  // 地（白ベース：記録を邪魔しないクリーンな下地）
  washi: '#FFFFFF',
  paper: '#FFFFFF',
  // 墨
  ink: '#171717', // 本文
  inkSoft: '#5E5E5E', // 副文
  // キャプション。#9B9B9B は白地に対して 2.8:1 しかなく読みづらかった
  inkFaint: '#757575',
  // 抹茶（MATCHAブランド色＝アプリの主アクセント）
  matcha: '#69AF00',
  matchaSoft: '#9CC455',
  // 藍（構造色）
  ai: '#2B4257',
  aiSoft: '#7C93A8',
  // 朱（御朱印専用の差し色）
  shu: '#C4432B',
  shuSoft: '#D98266',
  // 罫・面
  rule: '#ECECEC', // 罫線
  ruleStrong: '#D7D7D7',
  fill: '#F4F4F2', // 面(薄グレー)
  // 状態
  gold: '#A98037', // 限定バッジ等
  // 日本地図の「まだ行っていない県」。明所では面(fill)と同じでよい
  mapEmpty: '#F4F4F2',
  // 和紙の地色。WashiBackground と同じ値にしておく（継ぎ目を出さないため）
  washiPaper: '#FBF8F0',
  /**
   * 生成り。暗い地の上に置く文字色。
   * 明るい地では白が読めないので、明所では墨寄りの色を入れてある
   * （名前は「暗い面の上の文字」という役割を指す）。
   */
  kinari: '#5E5A52',
} as const;

const dark = {
  washi: '#151310',
  paper: '#1E1B17',
  ink: '#EDE9E0',
  inkSoft: '#B3AB9D',
  /**
   * キャプション。以前は #7E766A で、暗い地に対して 4.1:1 しかなく
   * 都道府県名や凡例が沈んで読めなかった（実測）。
   * 墨の階調（ink > inkSoft > inkFaint）は保ったまま持ち上げてある。
   */
  inkFaint: '#9A9184',
  matcha: '#8FC93A',
  matchaSoft: '#6E9A2E',
  ai: '#8FB0D4',
  aiSoft: '#5D7590',
  shu: '#E2745F',
  shuSoft: '#B4523E',
  rule: '#2E2A24',
  ruleStrong: '#433D34',
  fill: '#242019',
  gold: '#CBA86A',
  /**
   * 日本地図の「まだ行っていない県」。
   * fill(#242019) は紙(#1E1B17)とほぼ同じ明るさで、地図が黒に沈んで
   * 見えなかった（UGCカードで顕著）。地図の上だけ一段持ち上げる。
   */
  mapEmpty: '#474034',
  /**
   * ボトムシートの和紙。
   * シートの中は ThemeScope で明テーマに固定してあるので、
   * 暗いテーマの端末でも紙は肌色のまま、文字は墨で出る。
   * ここは「暗いテーマの他の場所で紙色が要るとき」のための控え。
   */
  washiPaper: '#FBF8F0',
  // 生成り（未晒しの和紙の白）。純白より目に刺さらず、和の地に馴染む
  kinari: '#E8E0CE',
} as const;

// タイポグラフィ（@expo-google-fonts で読み込むファミリ名）
export const fonts = {
  // 明朝 — 見出し・数字・エディトリアル
  minchoRegular: 'ShipporiMincho_400Regular',
  minchoMedium: 'ShipporiMincho_500Medium',
  minchoBold: 'ShipporiMincho_700Bold',
  // ゴシック — UI・本文
  gothicRegular: 'ZenKakuGothicNew_400Regular',
  gothicMedium: 'ZenKakuGothicNew_500Medium',
  gothicBold: 'ZenKakuGothicNew_700Bold',
  // 筆 — 御朱印の墨書きだけに使う
  brush: 'YujiSyuku_400Regular',
} as const;

// 型スケール
export const type = {
  display: 40,
  h1: 30,
  h2: 23,
  h3: 18,
  body: 15,
  small: 13,
  micro: 11,
} as const;

// 余白リズム（8基調）
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const hairline = StyleSheet.hairlineWidth;

export type Palette = typeof light;

export const palettes = { light, dark };

// 数字を等幅で見せたい箇所のフォント指定（プラットフォーム差異吸収）
export const tabularFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
});
