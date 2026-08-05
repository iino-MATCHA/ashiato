/**
 * 診断で選んだ「行ったことのある都道府県」を、登録後の地図へそのまま渡す箱。
 *
 * **同じことを二度聞かない**のが要点。診断の途中で47県から選んでもらった以上、
 * 登録したあとにもう一度同じ地図を出すのは失礼だし、そこで人が落ちる。
 *
 * 流れ
 *   /quiz で選ぶ → ここに預ける → 登録（メール or Google）
 *   → 認証ゲート(app/index.tsx)が拾って user_prefectures に保存
 *   → 都道府県選択の画面を飛ばして、そのまま地図へ
 *
 * LPの「いくつ回りましたか？」用の箱（lib/pendingPrefectures）にも同じ県を
 * 書いておく。何かの理由で選択画面へ入ってしまった場合に、選んだ分が
 * 消えずに残る（そこでは選び直しではなく、入った状態から始まる）。
 */
import { PENDING_PREFECTURES_KEY } from '@/lib/pendingPrefectures';

const KEY = 'mj.quizHandoff';

export interface QuizHandoff {
  /** 訪問済みとして選ばれた都道府県コード */
  codes: number[];
  /** 診断が出したおすすめ（登録後に見せる余地を残すため一緒に持つ） */
  recommended: number[];
  /** 預けた日時（ISO） */
  savedAt: string;
}

function clean(v: any): QuizHandoff | null {
  if (!v || typeof v !== 'object') return null;
  const codes = Array.isArray(v.codes) ? v.codes.filter((n: any) => typeof n === 'number') : [];
  const recommended = Array.isArray(v.recommended)
    ? v.recommended.filter((n: any) => typeof n === 'number')
    : [];
  return { codes, recommended, savedAt: typeof v.savedAt === 'string' ? v.savedAt : '' };
}

/** 診断の結果画面で預ける。CTAを押す前でも呼んでよい（上書きされるだけ） */
export function saveHandoff(codes: number[], recommended: number[]): void {
  if (typeof window === 'undefined') return;
  const payload: QuizHandoff = { codes, recommended, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
    // 都道府県選択の画面に入ってしまったときの保険
    localStorage.setItem(PENDING_PREFECTURES_KEY, JSON.stringify(codes));
  } catch {}
}

/** 中身を見る（消さない）。「診断から来た人か」の判定に使う */
export function peekHandoff(): QuizHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? clean(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** 取り出して消す。保存に成功したあとに呼ぶ */
export function takeHandoff(): QuizHandoff | null {
  const v = peekHandoff();
  clearHandoff();
  return v;
}

export function clearHandoff(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PENDING_PREFECTURES_KEY);
  } catch {}
}
