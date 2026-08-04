/**
 * シェアカードの寸法と配色。プレビュー(react-native-svg)と
 * 書き出し(canvas)の2つの実装が同じ絵になるよう、数値はここだけに置く。
 * 値はすべてカード幅・高さに対する比率。
 */
export const CARD_RATIO = 16 / 9; // 縦長ストーリー

export const C = {
  /** 余白 */
  margin: 0.085,
  /**
   * 地図の描画領域（カード高さに対する上端と高さ）。
   *
   * 文字は上に集めたので、地図は下いっぱいまで使う。
   * インスタのストーリーは下端 15% ほどに返信欄が重なるが、
   * そこへ来るのは地図の裾だけなので、読ませたいものは隠れない。
   */
  /** 地図だけの左右の逃げ。文字の余白より狭くして、日本を大きく見せる */
  mapInset: 0.02,
  mapTop: 0.235,
  mapHeight: 0.72,
  /** ピンの半径（カード幅に対する比率）と、写真枚数が多いときの下限 */
  pinR: 0.052,
  pinRMin: 0.032,
  /** ピン同士が重ならないようにする最小間隔（ピン直径に対する倍率） */
  pinSpread: 1.05,
} as const;

/**
 * カードの配色。**アプリのテーマには従わない。**
 *
 * ここが端末の明暗で変わると、暗い画面で見た人と明るい画面で見た人に
 * 別の絵が出る。書き出しは canvas 側で色を持っているため、
 * 「プレビューは黒いのに保存すると白い」という食い違いも起きていた（実測）。
 * カードは常にこの1組で描く。
 *
 * 地は墨。日本の形は明るく浮かせ、訪れた県だけを抹茶で塗る。
 * 白地より、写真の丸も文字も強く出る。
 */
export const PALETTE = {
  paper: '#26211A',
  paperEdge: '#1C1813',
  land: '#4A443B',
  landVisited: '#8CC63F',
  border: '#26211A',
  ink: '#F6F3EA',
  inkSoft: '#BDB6A8',
  inkFaint: '#8C857A',
  matcha: '#8CC63F',
  pinRing: '#F6F3EA',
} as const;

/** 文字の大きさ（カード幅に対する比率）。小さく、端に寄せる。 */
export const TYPE = {
  eyebrow: 0.026,
  meta: 0.028,
  title: 0.055,
  stat: 0.030,
} as const;

/** ピン半径は枚数が増えるほど小さく。 */
export function pinRadius(cardW: number, count: number): number {
  const t = Math.min(1, Math.max(0, (count - 4) / 14));
  return cardW * (C.pinR + (C.pinRMin - C.pinR) * t);
}
