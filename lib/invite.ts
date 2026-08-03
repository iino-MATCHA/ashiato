/**
 * バディーの招待を送る。
 *
 * 以前はここで招待カードの画像を描いていたが、やめた。
 * リンクを貼れば LINE でも SNS でもOGP画像（public/og-en.png）が自動で出る。
 * 自前のカードを重ねても、同じものが二枚並ぶだけで良くならない。
 * 送るのは**文面とリンクだけ**にする。
 *
 * 旅への招待は、その旅への直リンクに合鍵を付けて送る。
 * 受け取った人はログインせずに中身を見られ、写真を足したくなった
 * ところで初めて登録を求められる（0024 / app/trip/[id]/index.tsx）。
 */
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { fetchInviteToken } from '@/lib/api';

const SITE = 'https://www.my-japan-matcha.com';

export type InviteResult = 'shared' | 'copied' | 'failed';

/** 招待の文面。旅を指定すればその旅への招待になる。 */
export function inviteText(tripTitle?: string): string {
  const head = tripTitle ? `${t('buddy.inviteTitle')} — ${tripTitle}` : t('buddy.inviteTitle');
  return `${head}\n${t('buddy.inviteBody')}`;
}

/**
 * 旅への招待リンク。合鍵を取れなければサイトの入口を返す
 * （リンクが死ぬより、入口でも届いたほうがまし）。
 */
export async function inviteUrl(tripId?: string): Promise<string> {
  if (!tripId) return SITE;
  const token = await fetchInviteToken(tripId);
  return token ? `${SITE}/trip/${tripId}?invite=${token}` : `${SITE}/trip/${tripId}`;
}

/**
 * 招待を送る。共有シートが使えればそこへ、駄目ならクリップボードへ。
 *
 * 共有シートは「押した流れの中」でしか開けない。合鍵を取りに行くと
 * その流れが切れるので、**リンクは先に用意して**渡すこと
 * （呼ぶ側が事前に inviteUrl() を解決しておく）。
 */
export async function shareInvite(tripTitle?: string, url: string = SITE): Promise<InviteResult> {
  track('invite_shared', { hasTrip: !!tripTitle });
  const text = inviteText(tripTitle);

  try {
    const nav: any = typeof navigator === 'undefined' ? null : navigator;
    if (nav?.share) {
      // url を分けて渡すと、貼り先がリンクとして扱ってOGPを展開してくれる
      await nav.share({ title: t('buddy.inviteTitle'), text, url });
      return 'shared';
    }
  } catch {
    // シートを閉じられた場合もここに来る。文面を残して終える
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
