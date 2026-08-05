/**
 * 診断の質問。
 *
 * **質問を足す・消す・並べ替えるのはこの配列だけで済む。** 画面(QuizLanding)は
 * この配列をそのまま順に出しているだけで、質問の内容を知らない。
 *
 * 選択肢は `w`（weights）で data.ts の軸に重みを置く。重みは素点(0..3)に
 * 掛けて足されるだけなので、1 が標準、2 で「その答えを重く見る」。
 * 新しい軸を増やしたいときは data.ts の Axis と score.ts の素点の引き方を足す。
 *
 * 文字列は必ず i18n のキーで持つ（CLAUDE.md の決まり）。
 *
 * **kind:'slider' は日数・予算のような「量」を聞く問い。**
 * ボタンの3択（短い/普通/長い）だと荒すぎたため、実際の数字をドラッグで
 * 答えてもらう形にした。`axisFromValue` がその数字を短い/長い・安い/ゆとり
 * の重みへなだらかに変換する（3段階の断層を作らない）。都道府県の知識は
 * ここにも一切無い ―― 「7日と答えた」という事実を軸の重みに直すだけ。
 */
import type { Axis } from './data';

export interface QuizOption {
  id: string;
  /** i18n キー */
  labelKey: string;
  /** 軸への重み */
  w?: Partial<Record<Axis, number>>;
}

export interface QuizQuestion {
  id: string;
  /** i18n キー */
  titleKey: string;
  /** 補足（任意） */
  hintKey?: string;
  /**
   * single … 1つ選ぶと次へ進む
   * multi  … 複数選んで「次へ」で進む（max まで）
   * slider … 数値をドラッグで答える（axisFromValue で軸へ変換）
   * prefectures … 日本地図から訪問済みを選ぶ専用の問い
   */
  kind: 'single' | 'multi' | 'slider' | 'prefectures';
  /** multi のとき選べる上限 */
  max?: number;
  options?: QuizOption[];
  /** slider のとき: 範囲・刻み・初期値（multi の上限 `max` と紛れないよう別名にする） */
  sliderMin?: number;
  sliderMax?: number;
  step?: number;
  default?: number;
  /** slider の値 → 軸の重み。なだらかな連続量にするための変換式 */
  axisFromValue?: (value: number) => Partial<Record<Axis, number>>;
}

/** 0〜1 に収める小さな助け（slider の変換式だけで使う） */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'interest',
    kind: 'multi',
    max: 5,
    titleKey: 'quiz.q.interest',
    hintKey: 'quiz.q.interestHint',
    options: [
      { id: 'ramen', labelKey: 'quiz.o.ramen', w: { food: 2 } },
      { id: 'sake', labelKey: 'quiz.o.sake', w: { food: 1.5, history: 0.5 } },
      { id: 'sweets', labelKey: 'quiz.o.sweets', w: { food: 1, city: 0.5 } },
      { id: 'shrines', labelKey: 'quiz.o.shrines', w: { history: 2 } },
      { id: 'castles', labelKey: 'quiz.o.castles', w: { history: 2, city: 0.5 } },
      { id: 'crafts', labelKey: 'quiz.o.crafts', w: { craft: 2 } },
      { id: 'festivals', labelKey: 'quiz.o.festivals', w: { history: 1, city: 0.5 } },
      { id: 'cityShopping', labelKey: 'quiz.o.cityShopping', w: { city: 2, urban: 1 } },
      { id: 'nightlife', labelKey: 'quiz.o.nightlife', w: { city: 1.5, urban: 1.5 } },
      { id: 'artMuseums', labelKey: 'quiz.o.artMuseums', w: { city: 1, history: 0.5 } },
      { id: 'onsen', labelKey: 'quiz.o.onsen', w: { onsen: 2 } },
      { id: 'mountainHikes', labelKey: 'quiz.o.mountainHikes', w: { mountain: 2, nature: 1 } },
      { id: 'snow', labelKey: 'quiz.o.snow', w: { mountain: 2 } },
      { id: 'beaches', labelKey: 'quiz.o.beaches', w: { sea: 2, island: 0.5 } },
      { id: 'island', labelKey: 'quiz.o.island', w: { island: 2 } },
      { id: 'wildlife', labelKey: 'quiz.o.wildlife', w: { wildlife: 2, nature: 1 } },
      { id: 'gardens', labelKey: 'quiz.o.gardens', w: { nature: 2 } },
      { id: 'popCulture', labelKey: 'quiz.o.popCulture', w: { city: 1.5, urban: 0.5 } },
    ],
  },
  {
    /**
     * 「海・山・街」の3択は絵になっていなかった（ユーザー指摘）。
     * 情景を思い浮かべてもらう形にして、1つの選択が複数軸へ跨って効くようにした。
     */
    id: 'scene',
    kind: 'single',
    titleKey: 'quiz.q.scene',
    hintKey: 'quiz.q.sceneHint',
    options: [
      { id: 'riceTerrace', labelKey: 'quiz.o.riceTerrace', w: { nature: 2, mountain: 1 } },
      { id: 'oldTown', labelKey: 'quiz.o.oldTown', w: { history: 2 } },
      { id: 'fishingVillage', labelKey: 'quiz.o.fishingVillage', w: { sea: 2 } },
      { id: 'neonCity', labelKey: 'quiz.o.neonCity', w: { urban: 2, city: 1 } },
      { id: 'snowPeaks', labelKey: 'quiz.o.snowPeaks', w: { mountain: 2 } },
      { id: 'tropicalIsland', labelKey: 'quiz.o.tropicalIsland', w: { island: 2, sea: 1 } },
    ],
  },
  {
    id: 'crowd',
    kind: 'single',
    titleKey: 'quiz.q.crowd',
    options: [
      { id: 'famous', labelKey: 'quiz.o.famous', w: { famous: 2 } },
      { id: 'quiet', labelKey: 'quiz.o.quiet', w: { quiet: 2 } },
      { id: 'mix', labelKey: 'quiz.o.mixCrowd', w: { famous: 1, quiet: 1 } },
    ],
  },
  {
    id: 'days',
    kind: 'slider',
    titleKey: 'quiz.q.days',
    hintKey: 'quiz.slider.daysHint',
    sliderMin: 2,
    sliderMax: 21,
    step: 1,
    default: 6,
    /**
     * 短い/長いの重みをなだらかに出す。
     * 2日なら「短い」一色、6日は「短い」寄りの中間、14日以上は「長い」一色。
     * 3段の断層を無くすのがこの式の目的で、数字自体に深い意味は無い。
     */
    axisFromValue: (n) => ({
      short: clamp01((8 - n) / 6) * 2,
      long: clamp01((n - 5) / 12) * 2,
    }),
  },
  {
    id: 'budget',
    kind: 'slider',
    titleKey: 'quiz.q.budget',
    hintKey: 'quiz.slider.budgetHint',
    sliderMin: 5000,
    sliderMax: 60000,
    step: 1000,
    default: 15000,
    axisFromValue: (n) => ({
      cheap: clamp01((22000 - n) / 15000) * 2,
      premium: clamp01((n - 15000) / 40000) * 2,
    }),
  },
  {
    id: 'season',
    kind: 'single',
    titleKey: 'quiz.q.season',
    options: [
      { id: 'spring', labelKey: 'quiz.o.spring', w: { spring: 2 } },
      { id: 'summer', labelKey: 'quiz.o.summer', w: { summer: 2 } },
      { id: 'autumn', labelKey: 'quiz.o.autumn', w: { autumn: 2 } },
      { id: 'winter', labelKey: 'quiz.o.winter', w: { winter: 2 } },
      { id: 'undecided', labelKey: 'quiz.o.undecided' },
    ],
  },
  {
    id: 'experience',
    kind: 'single',
    titleKey: 'quiz.q.experience',
    options: [
      // 初来日は名の通った土地を上へ。2回目以降は静かな土地を上へ
      { id: 'first', labelKey: 'quiz.o.first', w: { famous: 2 } },
      { id: 'again', labelKey: 'quiz.o.again', w: { quiet: 1 } },
      { id: 'many', labelKey: 'quiz.o.many', w: { quiet: 2 } },
    ],
  },
  {
    // 訪問済み。結果から除外し、そのまま登録後の My Japan Map に引き継ぐ
    id: 'visited',
    kind: 'prefectures',
    titleKey: 'quiz.q.visited',
    hintKey: 'quiz.q.visitedHint',
  },
];

/** 診断の問いの数（訪問済みを含む） */
export const QUESTION_COUNT = QUESTIONS.length;
