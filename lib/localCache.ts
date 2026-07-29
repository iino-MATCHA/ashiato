/**
 * 前回取れたデータを端末に残しておき、開いた瞬間に出すための小さな置き場。
 *
 * 地下鉄のように往復が遅い場所では、問い合わせが返るまで画面が空になる。
 * 白い画面を見せるより、前回の内容を即座に出して裏で取り直すほうがいい
 * （取り直せたら差し替える。取れなければ前回の内容が残る）。
 *
 * 保存先は localStorage。ネイティブでも react-native-web ではなく
 * 実装が無いので、その場合は黙って何もしない（機能は落ちない）。
 * 値は「古いかもしれないもの」として扱う ―― ここから読んだ内容で
 * 保存や課金の判断はしない。
 */

const PREFIX = 'myjapan.cache.';
/** これより古いものは使わない（1週間）。 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry<T> { at: number; value: T }

function store(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** 同期で読む。描画の1フレーム目に間に合わせたいので await しない。 */
export function readCache<T>(key: string): T | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || typeof entry.at !== 'number') return null;
    if (Date.now() - entry.at > MAX_AGE_MS) {
      s.removeItem(PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value } satisfies Entry<T>));
  } catch {
    // 容量超過。古いものを捨てて、それでも駄目なら諦める
    try {
      Object.keys(s).filter((k) => k.startsWith(PREFIX)).forEach((k) => s.removeItem(k));
      s.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }));
    } catch {}
  }
}

/** サインアウト時に呼ぶ。他人の端末に前の利用者の記録を残さない。 */
export function clearCache(): void {
  const s = store();
  if (!s) return;
  try {
    Object.keys(s).filter((k) => k.startsWith(PREFIX)).forEach((k) => s.removeItem(k));
  } catch {}
}

/** 利用者ごとに分ける。共有端末で前の人の旅が出ないように。 */
export function cacheKey(name: string, uid?: string | null): string {
  return `${name}:${uid ?? 'anon'}`;
}
