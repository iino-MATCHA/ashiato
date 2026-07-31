/**
 * バディーの招待を送る。
 *
 * 以前はここで招待カードの画像を描いていたが、やめた。
 * リンクを貼れば LINE でも SNS でもOGP画像（public/og.png）が自動で出る。
 * 自前のカードを重ねても、同じものが二枚並ぶだけで良くならない。
 * 送るのは**文面とリンクだけ**にする。
 */
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const SITE = 'https://www.my-japan-matcha.com';

export type InviteResult = 'shared' | 'copied' | 'failed';

/** 招待の文面。旅を指定すればその旅への招待になる。 */
export function inviteText(tripTitle?: string): string {
  const head = tripTitle ? `${t('buddy.inviteTitle')} — ${tripTitle}` : t('buddy.inviteTitle');
  return `${head}\n${t('buddy.inviteBody')}`;
}

/**
 * 招待を送る。共有シートが使えればそこへ、駄目ならクリップボードへ。
 * 押した流れの中で呼ぶこと（await を挟むとシートが開けなくなる）。
 */
export async function shareInvite(tripTitle?: string): Promise<InviteResult> {
  track('invite_shared', { hasTrip: !!tripTitle });
  const text = inviteText(tripTitle);

  try {
    const nav: any = typeof navigator === 'undefined' ? null : navigator;
    if (nav?.share) {
      // url を分けて渡すと、貼り先がリンクとして扱ってOGPを展開してくれる
      await nav.share({ title: t('buddy.inviteTitle'), text, url: SITE });
      return 'shared';
    }
  } catch {
    // シートを閉じられた場合もここに来る。文面を残して終える
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${SITE}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
