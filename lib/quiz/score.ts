/**
 * 診断ロジック。
 *
 * 都道府県の知識はここに書かない ―― 素点は data.ts、質問と重みは
 * questions.ts にある。ここがやるのは「答え → 軸の重み → 47県の得点」の
 * 計算と、結果の絞り込みだけ。
 *
 * 得点は **重みの合計で割った平均** にしてある。単純な合計だと
 * 「何でも揃っている県」（北海道・兵庫）が質問の内容に関わらず上に来る。
 *
 * **軸は2階級ある。** 「何がしたいか」（興味・地形）が主で、
 * 静か/有名・予算・日数・季節は従（主72% + 従28%で合成する）。
 * 全軸を同じ土俵で平均していた頃、離島・ビーチと答えたのに沖縄が
 * 一度も出ない事故が起きた ―― 性格設問の「静かな場所」で知名度5の
 * 沖縄が0点になり、予算の軸でも沈み、興味の満点が埋もれていた。
 * 行きたい場所の希望を、性格や財布の事情より先に立てる。
 *
 * 訪問済みの県は結果から必ず外す。行った所を勧めても意味がない。
 */
import { PREFECTURE_PROFILES, PROFILE_BY_CODE, REGION_BY_CODE, type Axis, type PrefectureProfile } from './data';
import { QUESTIONS, type QuizQuestion } from './questions';

/** 質問ID → 選んだ選択肢ID の配列（single でも配列で持つ） */
export type Answers = Record<string, string[]>;

export interface Recommendation {
  code: number;
  /** 0..1 の当てはまり具合（表示には使わないが、絞り込みに使う） */
  fit: number;
  /** 効いた軸（上位から最大3つ）。i18n の quiz.axis.* で名前を出す */
  matched: Axis[];
  /** 日数の目安 */
  days: number;
  /** 選ばれた季節に、その県へ行く理由があるか */
  seasonFits: boolean;
}

/** 軸ごとの、その県の素点（0..3に揃える） */
function axisScore(p: PrefectureProfile, axis: Axis): number {
  switch (axis) {
    case 'food': return p.s.food;
    case 'nature': return p.s.nature;
    case 'history': return p.s.history;
    case 'city': return p.s.city;
    case 'onsen': return p.s.onsen;
    case 'island': return p.s.island;
    case 'craft': return p.s.craft;
    case 'wildlife': return p.s.wildlife;
    case 'sea': return p.s.sea;
    case 'mountain': return p.s.mountain;
    case 'urban': return p.s.urban;
    // 知名度は 1..5。有名を望むなら高いほど、静けさを望むなら低いほど良い
    case 'famous': return (p.popularity - 1) * 0.75;
    case 'quiet': return (5 - p.popularity) * 0.75;
    // 費用感は 1..3
    case 'cheap': return 4 - p.budget;
    case 'premium': return p.budget;
    // 日数。短い旅なら1県で完結する所、長い旅なら腰を据えられる所
    case 'short': return Math.max(0, Math.min(3, 5 - p.days));
    case 'long': return Math.max(0, Math.min(3, p.days - 1));
    case 'spring': return p.seasons.spring;
    case 'summer': return p.seasons.summer;
    case 'autumn': return p.seasons.autumn;
    case 'winter': return p.seasons.winter;
    default: return 0;
  }
}

/** 答え → 軸ごとの重みの合計 */
export function weightsFor(answers: Answers): Partial<Record<Axis, number>> {
  const out: Partial<Record<Axis, number>> = {};
  const add = (contrib: Partial<Record<Axis, number>>) => {
    Object.entries(contrib).forEach(([axis, w]) => {
      out[axis as Axis] = (out[axis as Axis] ?? 0) + (w as number);
    });
  };
  QUESTIONS.forEach((q: QuizQuestion) => {
    // slider は選択肢を持たない。答えた数値を axisFromValue で軸へ変換する
    if (q.kind === 'slider') {
      const raw = Number((answers[q.id] ?? [])[0]);
      if (Number.isFinite(raw) && q.axisFromValue) add(q.axisFromValue(raw));
      return;
    }
    const picked = answers[q.id] ?? [];
    (q.options ?? []).forEach((o) => {
      if (picked.includes(o.id)) add(o.w ?? {});
    });
  });
  return out;
}

/** 選ばれた季節（無ければ null） */
export function chosenSeason(answers: Answers): 'spring' | 'summer' | 'autumn' | 'winter' | null {
  const id = (answers.season ?? [])[0];
  if (id === 'spring' || id === 'summer' || id === 'autumn' || id === 'winter') return id;
  return null;
}

/**
 * おすすめの都道府県を1〜3件返す。
 *
 * - visited は必ず除外する
 * - 同じ地方は2件まで（九州の温泉が3件並ぶのを避ける）
 * - 2件目・3件目は、1件目に対して LEAD_RATIO 以上の当てはまりがあるときだけ出す
 *   （「この人には長野しかない」ときに無理に3件並べない）
 */
const LEAD_RATIO = 0.82;
const MAX_PER_REGION = 2;

/**
 * 従の軸。合成では28%しか持たない。
 * ここに無い軸（興味・地形）が主で、72%を持つ。
 */
const SECONDARY = new Set<Axis>([
  'famous', 'quiet', 'cheap', 'premium', 'short', 'long',
  'spring', 'summer', 'autumn', 'winter',
]);
const PRIMARY_SHARE = 0.72;

export function recommend(answers: Answers, visited: Iterable<number>, limit = 3): Recommendation[] {
  const w = weightsFor(answers);
  const axes = Object.keys(w) as Axis[];
  const priAxes = axes.filter((a) => !SECONDARY.has(a));
  const secAxes = axes.filter((a) => SECONDARY.has(a));
  const priW = priAxes.reduce((sum, a) => sum + (w[a] ?? 0), 0);
  const secW = secAxes.reduce((sum, a) => sum + (w[a] ?? 0), 0);
  const skip = new Set(visited);
  const season = chosenSeason(answers);

  const scored = PREFECTURE_PROFILES.filter((p) => !skip.has(p.code)).map((p) => {
    // 軸ごとの寄与。あとで「効いた軸」を選ぶのにも使う
    const parts = axes.map((a) => ({ axis: a, v: (w[a] ?? 0) * axisScore(p, a) }));
    // 3 が素点の上限なので、重み合計×3 が満点
    const avg = (list: Axis[], total: number) =>
      total > 0
        ? parts.filter((x) => list.includes(x.axis)).reduce((t, x) => t + x.v, 0) / (total * 3)
        : null;
    const pri = avg(priAxes, priW);
    const sec = avg(secAxes, secW);
    // どちらかしか答えが無ければ、あるほうだけで測る
    const fit =
      pri != null && sec != null
        ? pri * PRIMARY_SHARE + sec * (1 - PRIMARY_SHARE)
        : pri ?? sec ?? 0;
    // 「効いた軸」は主を先に出す（従の理由だけが並ぶと結果の説明にならない）
    const matched = [
      ...parts.filter((x) => !SECONDARY.has(x.axis) && x.v > 0).sort((a, b) => b.v - a.v),
      ...parts.filter((x) => SECONDARY.has(x.axis) && x.v > 0).sort((a, b) => b.v - a.v),
    ]
      .slice(0, 3)
      .map((x) => x.axis);
    return {
      code: p.code,
      fit,
      matched,
      days: p.days,
      seasonFits: season ? p.seasons[season] >= 2 : false,
    } as Recommendation;
  });

  scored.sort((a, b) => b.fit - a.fit || a.code - b.code);
  if (!scored.length) return [];

  const out: Recommendation[] = [];
  const perRegion: Record<string, number> = {};
  for (const cand of scored) {
    if (out.length >= limit) break;
    const region = REGION_BY_CODE[cand.code] ?? 'other';
    if ((perRegion[region] ?? 0) >= MAX_PER_REGION) continue;
    // 2件目以降は、1件目からあまり離れていないものだけ
    if (out.length > 0 && out[0].fit > 0 && cand.fit / out[0].fit < LEAD_RATIO) break;
    perRegion[region] = (perRegion[region] ?? 0) + 1;
    out.push(cand);
  }
  return out;
}

/** 答えが診断に足りているか（訪問済みの問いは0件でも成立する） */
export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => q.kind === 'prefectures' || (answers[q.id] ?? []).length > 0);
}

export { PROFILE_BY_CODE };
