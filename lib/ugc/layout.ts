/**
 * シェアカードの寸法と配色。プレビュー(react-native-svg)と
 * 書き出し(canvas)の2つの実装が同じ絵になるよう、数値はここだけに置く。
 * 値はすべてカード幅・高さに対する比率。
 */
export const CARD_RATIO = 16 / 9; // 縦長ストーリー

export const C = {
  /** 余白 */
  margin: 0.085,
  /** 地図の描画領域（カード高さに対する上端と高さ） */
  mapTop: 0.185,
  mapHeight: 0.6,
  /** ピンの半径（カード幅に対する比率）と、写真枚数が多いときの下限 */
  pinR: 0.052,
  pinRMin: 0.032,
  /** ピン同士が重ならないようにする最小間隔（ピン直径に対する倍率） */
  pinSpread: 1.05,
} as const;

/** 和紙の白を地に、県は淡い墨、訪れた県だけ抹茶を薄く敷く。 */
export const PALETTE = {
  paper: '#FBFAF7',
  paperEdge: '#F2F0EA',
  land: '#E8E7E1',
  landVisited: '#DCE9C4',
  border: '#C9C7BF',
  ink: '#1B1815',
  inkSoft: '#6B6862',
  inkFaint: '#9C988F',
  matcha: '#69AF00',
  pinRing: '#FFFFFF',
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
