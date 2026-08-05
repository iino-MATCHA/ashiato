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
   * prefectures … 日本地図から訪問済みを選ぶ専用の問い
   */
  kind: 'single' | 'multi' | 'prefectures';
  /** multi のとき選べる上限 */
  max?: number;
  options?: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'interest',
    kind: 'multi',
    max: 3,
    titleKey: 'quiz.q.interest',
    hintKey: 'quiz.q.interestHint',
    options: [
      { id: 'food', labelKey: 'quiz.o.food', w: { food: 2 } },
      { id: 'nature', labelKey: 'quiz.o.nature', w: { nature: 2 } },
      { id: 'history', labelKey: 'quiz.o.history', w: { history: 2 } },
      { id: 'city', labelKey: 'quiz.o.city', w: { city: 2, urban: 1 } },
      { id: 'onsen', labelKey: 'quiz.o.onsen', w: { onsen: 2 } },
      { id: 'island', labelKey: 'quiz.o.island', w: { island: 2, sea: 1 } },
    ],
  },
  {
    id: 'terrain',
    kind: 'single',
    titleKey: 'quiz.q.terrain',
    options: [
      { id: 'sea', labelKey: 'quiz.o.sea', w: { sea: 2 } },
      { id: 'mountain', labelKey: 'quiz.o.mountain', w: { mountain: 2 } },
      { id: 'urban', labelKey: 'quiz.o.urban', w: { urban: 2 } },
      { id: 'any', labelKey: 'quiz.o.anyTerrain' },
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
    kind: 'single',
    titleKey: 'quiz.q.days',
    options: [
      { id: 'short', labelKey: 'quiz.o.days13', w: { short: 2 } },
      { id: 'mid', labelKey: 'quiz.o.days46', w: { short: 1, long: 1 } },
      { id: 'long', labelKey: 'quiz.o.days7', w: { long: 2 } },
    ],
  },
  {
    id: 'budget',
    kind: 'single',
    titleKey: 'quiz.q.budget',
    options: [
      { id: 'thrifty', labelKey: 'quiz.o.thrifty', w: { cheap: 2 } },
      { id: 'moderate', labelKey: 'quiz.o.moderate', w: { cheap: 1 } },
      { id: 'comfortable', labelKey: 'quiz.o.comfortable', w: { premium: 2 } },
    ],
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
