/**
 * 招待カードを作って渡す。
 *
 * 画像を共有シートに載せられるのはスマホのブラウザ（Web Share API の
 * ファイル共有）とネイティブだけ。載せられない環境では文面とリンクを
 * クリップボードへ置く。黙って何も起きない、という状態は作らない。
 */
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const SITE = 'https://www.my-japan-matcha.com';

export type InviteResult = 'shared' | 'copied' | 'failed';

/** 招待の文面。旅を指定すればその旅への招待になる。 */
export function inviteText(tripTitle?: string): string {
  const head = tripTitle ? `${t('buddy.inviteTitle')} — ${tripTitle}` : t('buddy.inviteTitle');
  return `${head}\n${t('buddy.inviteBody')}\n${SITE}`;
}

/**
 * 招待カードを1枚描く。
 * 外部フォントの読み込みを待たずに済むよう、システムのゴシックで組む
 * （待っている間に共有シートを開くジェスチャが切れるため）。
 */
function drawCard(tripTitle?: string): string | null {
  if (typeof document === 'undefined') return null;
  const W = 1080;
  const H = 1080;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) return null;

  g.fillStyle = '#FBFAF7';
  g.fillRect(0, 0, W, H);

  // 背景にファビコンと同じ抹茶の円。右上に大きく置いて、少しはみ出させる
  g.fillStyle = '#69AF00';
  g.globalAlpha = 0.12;
  g.beginPath();
  g.arc(W * 0.82, H * 0.2, 340, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(W * 0.82, H * 0.2, 120, 0, Math.PI * 2);
  g.fill();
  // 円の中は白抜きの「印」らしく
  g.fillStyle = '#FBFAF7';
  g.font = '700 76px "Hiragino Mincho ProN", "Yu Mincho", serif';
  g.textAlign = 'center';
  g.fillText('旅', W * 0.82, H * 0.2 + 28);

  g.textAlign = 'left';
  g.fillStyle = '#9B978F';
  g.font = '500 26px system-ui, sans-serif';
  g.fillText('M Y   J A P A N', 100, 180);

  g.fillStyle = '#171717';
  g.font = '700 60px "Hiragino Mincho ProN", "Yu Mincho", serif';
  wrapLeft(g, t('buddy.inviteTitle'), 100, 430, W - 320, 84);

  if (tripTitle) {
    g.fillStyle = '#69AF00';
    g.font = '600 38px system-ui, sans-serif';
    wrapLeft(g, tripTitle, 100, 560, W - 240, 54);
  }

  g.fillStyle = '#5E5B57';
  g.font = '400 32px system-ui, sans-serif';
  wrapLeft(g, t('buddy.inviteBody'), 100, tripTitle ? 680 : 620, W - 220, 52);

  g.fillStyle = '#9B978F';
  g.font = '400 26px system-ui, sans-serif';
  g.fillText(SITE.replace('https://', ''), 100, H - 110);

  return c.toDataURL('image/png');
}

/** 左揃えの折り返し。textAlign は呼び出し側の設定をそのまま使う。 */
function wrapLeft(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    if (ch === '\n') { lines.push(line); line = ''; continue; }
    const next = line + ch;
    if (g.measureText(next).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
}


/**
 * 招待を送る。共有シートが使えれば画像ごと、駄目ならクリップボードへ。
 * 押した流れの中で呼ぶこと（await を挟むとシートが開けなくなる）。
 */
export async function shareInvite(tripTitle?: string): Promise<InviteResult> {
  track('invite_shared', { hasTrip: !!tripTitle });
  const text = inviteText(tripTitle);

  try {
    const dataUrl = drawCard(tripTitle);
    const nav: any = typeof navigator === 'undefined' ? null : navigator;
    if (dataUrl && nav?.share && nav?.canShare) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'my-japan-invite.png', { type: 'image/png' });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text, title: t('buddy.inviteTitle') });
        return 'shared';
      }
    }
    if (nav?.share) {
      await nav.share({ text, title: t('buddy.inviteTitle'), url: SITE });
      return 'shared';
    }
  } catch {
    // 共有シートを閉じられた場合もここに来る。文面を残して終える
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
