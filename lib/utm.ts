/**
 * 広告からの流入元（UTM）を、登録が終わるまで持ち続ける。
 *
 * 広告 → LP → 診断 → 登録 の間に画面遷移とリダイレクト（メール確認・
 * Google の戻り）が挟まるので、URLのパラメータはすぐ消える。
 * 最初に見た値を端末に預けて、以後の計測イベント全部に乗せる。
 *
 * 端末に残すだけで、DBには入れていない。DBで集計したくなったら
 * profiles に列を足してここから書く（今は GA4 / Pixel のイベント側で持つ）。
 */
const KEY = 'mj.utm';

const FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  // 広告のクリックID。UTMが付いていない配信でも流入元が分かる
  'gclid',
  'fbclid',
  'ttclid',
  'msclkid',
] as const;

export type UtmField = (typeof FIELDS)[number];

export interface Utm extends Partial<Record<UtmField, string>> {
  /** 最初に来た日時（ISO） */
  first_seen?: string;
  /** 最初に開いたページ */
  landing_page?: string;
  /** 計測イベントのパラメータにそのまま広げて渡せるようにしておく */
  [key: string]: string | undefined;
}

function read(): Utm {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function write(v: Utm) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // プライベートモード等で書けなくても、計測のためにアプリを止めない
  }
}

/**
 * URLに流入元が付いていたら預かる。
 *
 * 付いていないときは**上書きしない** ―― LPの中で画面が変わるたびに
 * 空で塗り潰すと、登録の時点で流入元が消えてしまう。
 * 付いていたら新しい方を採る（最後にクリックされた広告の成果にする）。
 */
export function captureUtm(): Utm {
  if (typeof window === 'undefined') return {};
  const prev = read();
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return prev;
  }
  const found: Utm = {};
  FIELDS.forEach((f) => {
    const v = params.get(f);
    if (v) found[f] = v.slice(0, 200);
  });
  if (!Object.keys(found).length) {
    // 初回だけ、流入元なしでも入口のページは残す
    if (!prev.first_seen) {
      const next: Utm = {
        ...prev,
        first_seen: new Date().toISOString(),
        landing_page: window.location.pathname,
      };
      write(next);
      return next;
    }
    return prev;
  }
  const next: Utm = {
    ...prev,
    ...found,
    first_seen: prev.first_seen ?? new Date().toISOString(),
    landing_page: prev.landing_page ?? window.location.pathname,
  };
  write(next);
  return next;
}

/** 預かっている流入元。イベントのパラメータにそのまま広げて使う */
export function getUtm(): Utm {
  if (typeof window === 'undefined') return {};
  return read();
}

/** 登録が終わって計測し切ったあとに捨てる（残しておくと次の人の分に混ざる） */
export function clearUtm() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
