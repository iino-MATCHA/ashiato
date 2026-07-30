/**
 * LPで「いくつ回りましたか？」に答えた分を、登録が終わるまで端末に預けておく箱。
 * 登録直後の都道府県選択（(auth)/prefectures）がここから拾って、
 * 選んだ御朱印が入った状態で始められるようにする。拾ったら消す。
 */
export const PENDING_PREFECTURES_KEY = 'mj.pendingPrefectures';

/** 預けてある県コードを取り出して消す。無ければ空配列。 */
export function takePendingPrefectures(): number[] {
  try {
    const raw = localStorage.getItem(PENDING_PREFECTURES_KEY);
    if (!raw) return [];
    localStorage.removeItem(PENDING_PREFECTURES_KEY);
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}
