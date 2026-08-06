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
 *
 * **kind:'scale' は性格を聞く断定文。** 「旅先のランチは予約しておきたい」の
 * ような1文に、当てはまる〜当てはまらない の5段階で答えてもらう
 * （2026-08、タイプ診断らしさを足すために追加）。選択肢は `likert()` が組む ――
 * 「当てはまる」側と「当てはまらない」側それぞれの軸の重みを渡すと、
 * 「やや」は半分の重み、「どちらでもない」は無配点になる。判定(score.ts)から
 * 見ればただの5択なので、ロジック側の変更は要らない。
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
   * scale  … 断定文に5段階（当てはまる〜当てはまらない）で答える。1つ選ぶと次へ
   * slider … 数値をドラッグで答える（axisFromValue で軸へ変換）
   * prefectures … 日本地図から訪問済みを選ぶ専用の問い
   */
  kind: 'single' | 'multi' | 'scale' | 'slider' | 'prefectures';
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

/**
 * 5段階（当てはまる〜当てはまらない）の選択肢を組む。
 * agree = その文に当てはまる人の軸、disagree = 当てはまらない人の軸。
 * 「やや」は半分の重み。「どちらでもない」はどちらにも寄せない。
 */
const likert = (
  agree: Partial<Record<Axis, number>>,
  disagree: Partial<Record<Axis, number>>
): QuizOption[] => {
  const half = (w: Partial<Record<Axis, number>>): Partial<Record<Axis, number>> =>
    Object.fromEntries(Object.entries(w).map(([k, v]) => [k, (v as number) / 2]));
  return [
    { id: 'agree2', labelKey: 'quiz.scale.agree2', w: agree },
    { id: 'agree1', labelKey: 'quiz.scale.agree1', w: half(agree) },
    { id: 'neutral', labelKey: 'quiz.scale.neutral' },
    { id: 'disagree1', labelKey: 'quiz.scale.disagree1', w: half(disagree) },
    { id: 'disagree2', labelKey: 'quiz.scale.disagree2', w: disagree },
  ];
};

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
  /**
   * ここから4問は性格の断定文（5段階）。
   * 旅の中身ではなく「その人がどう旅をするか」を聞いて、既存の軸に混ぜる。
   *   style  … 計画派 ↔ 直感派
   *   thrill … 未知・冒険 ↔ 王道・安心
   *   social … 交流 ↔ 没入（マイペース）
   *   energy … 充電 ↔ 発散
   */
  {
    // 計画派は名の通った・外れの無い土地が合う。直感派は路地と地元の店が濃い土地
    id: 'style',
    kind: 'scale',
    titleKey: 'quiz.q.style',
    hintKey: 'quiz.scaleHint',
    options: likert({ famous: 1.5, city: 0.5 }, { quiet: 1.5, food: 0.5 }),
  },
  {
    // 「ここどこ!?」を撮りたい人は静かな土地へ。絶景・ランドマーク派は有名どころへ
    id: 'thrill',
    kind: 'scale',
    titleKey: 'quiz.q.thrill',
    hintKey: 'quiz.scaleHint',
    options: likert({ quiet: 2, nature: 0.5 }, { famous: 2 }),
  },
  {
    // 賑わいと乾杯が欲しい人は街と食の土地へ。静かに語りたい人は温泉と静けさへ
    id: 'social',
    kind: 'scale',
    titleKey: 'quiz.q.social',
    hintKey: 'quiz.scaleHint',
    options: likert({ city: 1, food: 1, urban: 0.5 }, { quiet: 1, onsen: 0.5, nature: 0.5 }),
  },
  {
    // 充電の旅は温泉と自然へ。発散の旅は街の刺激と体を動かす土地へ
    id: 'energy',
    kind: 'scale',
    titleKey: 'quiz.q.energy',
    hintKey: 'quiz.scaleHint',
    options: likert({ onsen: 1.5, nature: 1 }, { urban: 1, city: 0.5, mountain: 0.5 }),
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
