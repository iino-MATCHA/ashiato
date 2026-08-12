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
  paper: '#221E19',
  paperEdge: '#191510',
  /** 行っていない県。地から十分に浮くところまで明るくする */
  land: '#5B5347',
  landVisited: '#8CC63F',
  /**
   * 県境。地と同じ色にしていたので、境目が見えず一枚の塊に見えていた。
   * 地より明るく、県の塗りより暗い中間に置いて、輪郭を立てる。
   */
  border: '#7E7568',
  ink: '#F6F3EA',
  inkSoft: '#BDB6A8',
  inkFaint: '#8C857A',
  matcha: '#8CC63F',
  /** 写真の丸を地から切り離す縁。少し黄みを残した紙の白 */
  pinRing: '#E8DFC9',
  /** 左上に散らす大判写真の縁。抹茶の明るい側 */
  photoFrame: '#A5D65C',
} as const;

/** 文字の大きさ（カード幅に対する比率）。題と数字は大きく、脇の字は小さく端へ。 */
export const TYPE = {
  eyebrow: 0.026,
  meta: 0.028,
  title: 0.082,
  stat: 0.056,
  /** 数字に添える単位（pref / days / km）は数字に対する倍率 */
  statLabel: 0.46,
} as const;

/**
 * 左上に重ねる大判写真（ポラロイド風）。
 * cx はカード幅、cy はカード高さに対する比率。傾きは度。
 * 地図の左上は海（日本海）なので、ここまでは重ねても陸もピンも隠れない。
 */
export const PHOTO = {
  w: 0.36,
  h: 0.28,
  /** 角丸。プレビュー幅(約340px)でおよそ16px */
  radius: 0.047,
  border: 0.007,
  slots: [
    { cx: 0.245, cy: 0.252, rot: -6 },
    { cx: 0.410, cy: 0.326, rot: 5 },
    { cx: 0.225, cy: 0.400, rot: -4 },
  ],
} as const;

/**
 * 明朝の数字幅の見積もり（カンマ・ピリオドは細い）。
 * SVGプレビューは実測できないので、canvas の実測とほぼ揃うこの値で流す。
 */
export function approxTextWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) w += ch === ',' || ch === '.' ? 0.30 : 0.60;
  return w * size;
}

/** ピン半径は枚数が増えるほど小さく。 */
export function pinRadius(cardW: number, count: number): number {
  const t = Math.min(1, Math.max(0, (count - 4) / 14));
  return cardW * (C.pinR + (C.pinRMin - C.pinR) * t);
}
