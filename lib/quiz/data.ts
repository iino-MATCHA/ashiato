/**
 * 都道府県診断のデータ。
 *
 * **ここを書き換えれば診断結果が変わる。** ロジック(score.ts)には
 * 都道府県の知識を一切入れていない ―― 47件の素点をここに集めてある。
 *
 * 素点の付け方
 *   興味・地形 … 0〜3。3は「その目的でわざわざ行く価値がある」。
 *                 0は「無いとは言わないが、そのために行く場所ではない」
 *   popularity … 1〜5。5は初来日でも名前を知っている（東京・京都・沖縄）、
 *                 1はまず名前が挙がらない。「有名な所／静かな所」の判定に使う
 *   budget     … 1〜3。1は物価も移動費も安い、3は行くだけで費用がかかる
 *   days       … その県だけで気持ちよく過ごせる日数の目安。
 *                 短い旅では小さい県、長い旅では大きい県が上に来る
 *   seasons    … 0〜3。その季節に行く理由の強さ（雪・紅葉・海・桜など）
 *
 * 素点は tourism_area_master の area_type の分布（hot_spring / island /
 * historic_area など）を見ながら付けてある。エリアが1件も無い県
 * （秋田・福井・滋賀）もあるので、素点はマスタから自動生成せず手で持つ。
 *
 * **craft（伝統工芸）と wildlife（野生動物）は2026-08に追加した軸。**
 * 「やりたい事」の選択肢を6→18に増やしたときに、既存の9軸だけでは
 * 陶芸・染織・木工と、熊やタンチョウ鶴のような生き物を区別できなかった
 * ため足した。
 */

/** 配点の軸。質問の選択肢はこの軸に重みを置く（questions.ts） */
export type Axis =
  // 興味
  | 'food'
  | 'nature'
  | 'history'
  | 'city'
  | 'onsen'
  | 'island'
  | 'craft'
  | 'wildlife'
  // 地形
  | 'sea'
  | 'mountain'
  | 'urban'
  // 有名 / 静か
  | 'famous'
  | 'quiet'
  // 予算
  | 'cheap'
  | 'premium'
  // 日数
  | 'short'
  | 'long'
  // 季節
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter';

export interface PrefectureProfile {
  /** JISコード 1..47 */
  code: number;
  /** 興味・地形の素点（0..3） */
  s: {
    food: number;
    nature: number;
    history: number;
    city: number;
    onsen: number;
    island: number;
    craft: number;
    wildlife: number;
    sea: number;
    mountain: number;
    urban: number;
  };
  /** 知名度 1..5 */
  popularity: number;
  /** 費用感 1..3 */
  budget: number;
  /** その県だけで過ごす日数の目安 1..5 */
  days: number;
  /** 季節ごとの「行く理由」の強さ 0..3 */
  seasons: { spring: number; summer: number; autumn: number; winter: number };
  /**
   * 結果に添える一言（任意）。i18n のキーを入れると、その訳が出る。
   * 空のままでも、選んだ答えと素点から文は組み立てられる（score.ts）。
   */
  noteKey?: string;
}

/** 地方。結果が同じ地方に固まらないようにするために使う */
export type Region =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kansai'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu'
  /**
   * **沖縄は九州に入れない。**
   * 同じ地方は2件までという絞り込みがあるので、九州に入れておくと
   * 長崎・鹿児島で枠が埋まり、沖縄が結果から落ちる。
   * 「離島」と答えたのに沖縄が一度も出ない、という事故の原因がこれだった。
   */
  | 'okinawa';

export const REGION_BY_CODE: Record<number, Region> = {
  1: 'hokkaido',
  2: 'tohoku', 3: 'tohoku', 4: 'tohoku', 5: 'tohoku', 6: 'tohoku', 7: 'tohoku',
  8: 'kanto', 9: 'kanto', 10: 'kanto', 11: 'kanto', 12: 'kanto', 13: 'kanto', 14: 'kanto',
  15: 'chubu', 16: 'chubu', 17: 'chubu', 18: 'chubu', 19: 'chubu', 20: 'chubu',
  21: 'chubu', 22: 'chubu', 23: 'chubu',
  24: 'kansai', 25: 'kansai', 26: 'kansai', 27: 'kansai', 28: 'kansai', 29: 'kansai', 30: 'kansai',
  31: 'chugoku', 32: 'chugoku', 33: 'chugoku', 34: 'chugoku', 35: 'chugoku',
  36: 'shikoku', 37: 'shikoku', 38: 'shikoku', 39: 'shikoku',
  40: 'kyushu', 41: 'kyushu', 42: 'kyushu', 43: 'kyushu', 44: 'kyushu',
  45: 'kyushu', 46: 'kyushu',
  47: 'okinawa',
};

/** 素点を書くときの助け。順番は s の宣言と同じ */
function s(
  food: number, nature: number, history: number, city: number, onsen: number,
  island: number, craft: number, wildlife: number, sea: number, mountain: number, urban: number
): PrefectureProfile['s'] {
  return { food, nature, history, city, onsen, island, craft, wildlife, sea, mountain, urban };
}

/** 季節。春・夏・秋・冬の順 */
function se(spring: number, summer: number, autumn: number, winter: number) {
  return { spring, summer, autumn, winter };
}

export const PREFECTURE_PROFILES: PrefectureProfile[] = [
  // ------------------------------------------------------------ 北海道
  // 熊・タンチョウ・キタキツネ・フクロウ。国内で最も野生動物が強い土地
  { code: 1, s: s(3, 3, 1, 2, 3, 0, 1, 3, 2, 3, 2), popularity: 5, budget: 3, days: 5, seasons: se(1, 3, 2, 3) },
  // ------------------------------------------------------------ 東北
  { code: 2, s: s(2, 3, 2, 1, 3, 0, 2, 2, 2, 3, 0), popularity: 2, budget: 2, days: 3, seasons: se(3, 2, 3, 2) }, // 津軽塗
  { code: 3, s: s(2, 3, 3, 1, 3, 0, 2, 2, 2, 3, 0), popularity: 2, budget: 1, days: 3, seasons: se(2, 2, 3, 2) }, // 南部鉄器
  { code: 4, s: s(3, 2, 2, 2, 3, 1, 1, 1, 3, 2, 2), popularity: 3, budget: 2, days: 3, seasons: se(2, 3, 3, 2) }, // こけし
  { code: 5, s: s(2, 3, 2, 1, 3, 0, 1, 2, 1, 3, 0), popularity: 2, budget: 1, days: 3, seasons: se(3, 2, 3, 3) }, // 樺細工
  { code: 6, s: s(2, 3, 2, 1, 3, 0, 1, 1, 1, 3, 0), popularity: 2, budget: 1, days: 3, seasons: se(2, 2, 3, 3) },
  { code: 7, s: s(2, 3, 3, 1, 3, 0, 2, 1, 1, 3, 1), popularity: 2, budget: 1, days: 3, seasons: se(2, 2, 3, 2) }, // 会津塗
  // ------------------------------------------------------------ 関東
  { code: 8, s: s(2, 2, 1, 1, 1, 0, 0, 1, 2, 1, 1), popularity: 1, budget: 1, days: 2, seasons: se(3, 1, 2, 1) },
  { code: 9, s: s(2, 3, 3, 1, 3, 0, 2, 1, 0, 3, 1), popularity: 3, budget: 2, days: 2, seasons: se(2, 2, 3, 2) }, // 益子焼
  { code: 10, s: s(1, 3, 1, 1, 3, 0, 1, 1, 0, 3, 0), popularity: 2, budget: 1, days: 2, seasons: se(1, 2, 3, 3) },
  { code: 11, s: s(2, 1, 2, 2, 1, 0, 0, 0, 0, 1, 2), popularity: 1, budget: 1, days: 2, seasons: se(2, 1, 2, 1) },
  { code: 12, s: s(2, 2, 1, 2, 1, 0, 0, 0, 3, 1, 2), popularity: 2, budget: 2, days: 2, seasons: se(2, 3, 1, 1) },
  { code: 13, s: s(3, 1, 2, 3, 1, 1, 1, 0, 1, 1, 3), popularity: 5, budget: 3, days: 3, seasons: se(3, 2, 2, 2) }, // 江戸切子
  { code: 14, s: s(2, 2, 3, 2, 3, 1, 0, 0, 2, 2, 3), popularity: 4, budget: 2, days: 2, seasons: se(2, 2, 3, 2) },
  // ------------------------------------------------------------ 中部
  { code: 15, s: s(3, 3, 1, 1, 3, 1, 2, 1, 2, 3, 1), popularity: 2, budget: 1, days: 3, seasons: se(2, 2, 3, 3) }, // 燕三条・漆器
  { code: 16, s: s(3, 3, 1, 1, 2, 0, 2, 1, 2, 3, 0), popularity: 2, budget: 2, days: 2, seasons: se(3, 2, 3, 2) }, // 高岡銅器
  { code: 17, s: s(3, 2, 3, 2, 3, 0, 3, 1, 2, 1, 2), popularity: 3, budget: 2, days: 3, seasons: se(2, 2, 3, 3) }, // 九谷焼・輪島塗・金箔
  { code: 18, s: s(3, 2, 2, 1, 2, 0, 2, 1, 3, 1, 0), popularity: 1, budget: 1, days: 2, seasons: se(2, 2, 2, 3) }, // 越前漆器・和紙・打刃物
  { code: 19, s: s(2, 3, 1, 1, 3, 0, 1, 1, 0, 3, 0), popularity: 3, budget: 2, days: 2, seasons: se(2, 2, 3, 2) },
  { code: 20, s: s(2, 3, 2, 1, 3, 0, 2, 3, 0, 3, 1), popularity: 3, budget: 1, days: 3, seasons: se(2, 3, 3, 3) }, // 地獄谷の雪猿
  { code: 21, s: s(2, 3, 3, 1, 3, 0, 3, 1, 0, 3, 1), popularity: 3, budget: 1, days: 3, seasons: se(2, 2, 3, 3) }, // 美濃焼・美濃和紙・飛騨の木工
  { code: 22, s: s(3, 3, 1, 1, 3, 1, 1, 1, 3, 3, 1), popularity: 3, budget: 2, days: 3, seasons: se(2, 3, 2, 2) },
  { code: 23, s: s(3, 1, 3, 3, 1, 1, 2, 0, 1, 0, 3), popularity: 3, budget: 2, days: 2, seasons: se(2, 2, 2, 2) }, // 瀬戸焼
  // ------------------------------------------------------------ 関西
  { code: 24, s: s(3, 2, 3, 1, 2, 1, 1, 1, 3, 1, 0), popularity: 2, budget: 2, days: 2, seasons: se(2, 2, 2, 1) },
  { code: 25, s: s(2, 3, 3, 1, 1, 0, 1, 1, 1, 2, 1), popularity: 1, budget: 1, days: 2, seasons: se(2, 2, 3, 1) },
  { code: 26, s: s(3, 2, 3, 3, 1, 0, 3, 0, 1, 2, 3), popularity: 5, budget: 3, days: 4, seasons: se(3, 1, 3, 2) }, // 西陣織・京焼
  { code: 27, s: s(3, 1, 2, 3, 1, 0, 1, 0, 1, 0, 3), popularity: 5, budget: 2, days: 2, seasons: se(2, 2, 2, 2) },
  { code: 28, s: s(3, 2, 3, 2, 3, 1, 1, 1, 3, 2, 3), popularity: 3, budget: 2, days: 3, seasons: se(2, 2, 2, 3) },
  { code: 29, s: s(1, 2, 3, 1, 1, 0, 2, 2, 0, 2, 1), popularity: 4, budget: 1, days: 2, seasons: se(3, 1, 3, 1) }, // 奈良墨・奈良の鹿
  { code: 30, s: s(2, 3, 3, 1, 3, 0, 1, 2, 3, 3, 0), popularity: 2, budget: 2, days: 3, seasons: se(2, 3, 3, 1) }, // クジラ・熊野の原生林
  // ------------------------------------------------------------ 中国
  { code: 31, s: s(3, 3, 1, 1, 2, 0, 1, 1, 3, 2, 0), popularity: 1, budget: 1, days: 2, seasons: se(1, 2, 2, 3) },
  { code: 32, s: s(2, 2, 3, 1, 2, 1, 2, 1, 3, 1, 0), popularity: 1, budget: 1, days: 3, seasons: se(2, 2, 2, 1) }, // 出雲・石見
  { code: 33, s: s(2, 2, 3, 2, 2, 1, 2, 1, 3, 1, 2), popularity: 2, budget: 1, days: 2, seasons: se(3, 2, 2, 1) }, // 備前焼
  { code: 34, s: s(3, 2, 3, 2, 1, 2, 2, 1, 3, 1, 2), popularity: 4, budget: 2, days: 3, seasons: se(3, 2, 3, 1) }, // 熊野筆
  { code: 35, s: s(3, 3, 2, 1, 2, 1, 2, 1, 3, 2, 0), popularity: 1, budget: 1, days: 2, seasons: se(2, 2, 2, 2) }, // 萩焼
  // ------------------------------------------------------------ 四国
  { code: 36, s: s(1, 3, 1, 1, 2, 0, 2, 1, 2, 3, 0), popularity: 1, budget: 1, days: 2, seasons: se(1, 3, 3, 1) }, // 阿波藍
  { code: 37, s: s(3, 2, 2, 1, 1, 3, 2, 1, 3, 1, 1), popularity: 2, budget: 1, days: 2, seasons: se(3, 3, 2, 1) }, // 讃岐漆器・丸亀うちわ
  { code: 38, s: s(2, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1), popularity: 2, budget: 1, days: 3, seasons: se(2, 2, 3, 1) },
  { code: 39, s: s(3, 3, 2, 1, 1, 0, 2, 2, 3, 3, 0), popularity: 1, budget: 1, days: 3, seasons: se(2, 3, 2, 1) }, // 土佐和紙・クジラ・四万十
  // ------------------------------------------------------------ 九州・沖縄
  { code: 40, s: s(3, 1, 2, 3, 1, 1, 2, 0, 2, 1, 3), popularity: 4, budget: 2, days: 2, seasons: se(3, 2, 2, 2) }, // 博多人形・博多織
  { code: 41, s: s(3, 1, 3, 1, 2, 0, 3, 1, 2, 1, 0), popularity: 1, budget: 1, days: 2, seasons: se(3, 1, 3, 1) }, // 有田・伊万里・唐津焼
  { code: 42, s: s(3, 2, 3, 2, 2, 3, 1, 2, 3, 1, 2), popularity: 3, budget: 2, days: 3, seasons: se(2, 2, 2, 2) }, // 五島・イルカ
  { code: 43, s: s(2, 3, 3, 2, 3, 1, 1, 2, 2, 3, 2), popularity: 3, budget: 1, days: 3, seasons: se(3, 2, 3, 1) }, // 阿蘇の草原
  { code: 44, s: s(2, 3, 1, 1, 3, 1, 2, 1, 2, 3, 1), popularity: 3, budget: 1, days: 3, seasons: se(2, 2, 3, 3) }, // 別府・竹田の竹細工
  { code: 45, s: s(3, 3, 2, 1, 2, 0, 1, 2, 3, 3, 0), popularity: 1, budget: 1, days: 3, seasons: se(2, 3, 2, 1) }, // 都井岬の野生馬
  { code: 46, s: s(3, 3, 2, 1, 3, 3, 2, 3, 3, 2, 1), popularity: 3, budget: 2, days: 4, seasons: se(2, 3, 2, 2) }, // 薩摩焼・屋久島・奄美
  { code: 47, s: s(3, 3, 2, 1, 1, 3, 2, 3, 3, 1, 1), popularity: 5, budget: 3, days: 4, seasons: se(3, 3, 2, 2) }, // 琉球ガラス・紅型・イリオモテヤマネコ
];

export const PROFILE_BY_CODE: Record<number, PrefectureProfile> = PREFECTURE_PROFILES.reduce(
  (acc, p) => {
    acc[p.code] = p;
    return acc;
  },
  {} as Record<number, PrefectureProfile>
);
