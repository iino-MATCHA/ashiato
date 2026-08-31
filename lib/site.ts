/**
 * このアプリが公開されている場所。**ドメインを書くのはここだけ。**
 *
 * 以前は8箇所にベタ書きしてあり、ドメインを変えるには全部を探して直す
 * 必要があった（共有カードの画像に焼き込む文字まで含めて）。
 * 引き継ぎで別のドメインへ移すことが決まったので、1箇所に集めた。
 *
 * **ドメインを変えるときは、このファイルの SITE_HOST だけを書き換える。**
 * コードで直すところは他に無い。
 * 画面の外（Supabase / Vercel / DNS / Google OAuth）でやることは
 * `docs/DOMAIN-MIGRATION.md` に手順として書いてある。
 */

/** 表に出すホスト名。共有カードの画像にもこの文字がそのまま焼かれる。 */
export const SITE_HOST = 'www.my-japan-matcha.com';

/** 正規のオリジン。認証の戻り先・共有リンク・OGP はすべてここを基準にする。 */
export const SITE_ORIGIN = `https://${SITE_HOST}`;

/**
 * apex（www なし）も同じサイトとして扱うための判定。
 * `www.example.com` に対して `example.com` と `*.example.com` を拾う。
 */
export const SITE_DOMAIN = SITE_HOST.replace(/^www\./, '');

/** サイト内のURLを組み立てる。先頭のスラッシュは有っても無くてもよい。 */
export function siteUrl(path = ''): string {
  return `${SITE_ORIGIN}/${String(path).replace(/^\/+/, '')}`;
}
