/**
 * 認証から戻ってくる先。
 *
 * apex(my-japan-matcha.com) は www へ 301 されるため、そのまま origin を渡すと
 * トークンを載せたURLが一度転送を挟む。確認メールのリンクも apex のまま届く。
 * 正規のホストへ揃えてから渡す。ローカルや他ドメインではその origin をそのまま使う。
 *
 * ログイン画面と診断LPの両方から使う（片方だけ直すと戻り先が食い違う）。
 */
import { SITE_ORIGIN, SITE_DOMAIN } from '@/lib/site';

/** 本番のホスト（apex も www も）かどうか。ドメイン名は lib/site.ts が持つ */
const isCanonicalHost = (host: string) =>
  host === SITE_DOMAIN || host.endsWith(`.${SITE_DOMAIN}`);

export const authRedirectTo: string | undefined =
  typeof window === 'undefined'
    ? undefined
    : isCanonicalHost(window.location.hostname)
      ? SITE_ORIGIN
      : window.location.origin;
