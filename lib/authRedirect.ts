/**
 * 認証から戻ってくる先。
 *
 * apex(my-japan-matcha.com) は www へ 301 されるため、そのまま origin を渡すと
 * トークンを載せたURLが一度転送を挟む。確認メールのリンクも apex のまま届く。
 * 正規のホストへ揃えてから渡す。ローカルや他ドメインではその origin をそのまま使う。
 *
 * ログイン画面と診断LPの両方から使う（片方だけ直すと戻り先が食い違う）。
 */
const CANONICAL = 'https://www.my-japan-matcha.com';

export const authRedirectTo: string | undefined =
  typeof window === 'undefined'
    ? undefined
    : /(^|\.)my-japan-matcha\.com$/.test(window.location.hostname)
      ? CANONICAL
      : window.location.origin;
