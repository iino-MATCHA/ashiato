/**
 * 立ち寄り先1枚カードの書き出し（Web）。
 * プレビュー（components/ugc/StopCard.tsx）と同じ構図を canvas に描く。
 * 数値をそちらと揃えてあるので、見えている通りに保存される。
 */
import { PALETTE } from './ugc/layout';
import { wrapText } from './ugc/wrap';

export interface StopCardMeta {
  image: string;
  title: string;
  place: string;
  prefecture: string;
  dateLabel: string;
}

const W = 1080;
const H = Math.round(W * (16 / 9));
const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportStopCard(meta: StopCardMeta): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const m = W * 0.085;
    const photoTop = H * 0.11;
    const photoH = H * 0.62;
    const photoW = W - m * 2;

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    // 写真の白い縁
    const b = W * 0.012;
    ctx.fillStyle = PALETTE.pinRing;
    ctx.fillRect(m - b, photoTop - b, photoW + b * 2, photoH + b * 2);

    const img = await loadImage(meta.image);
    if (img) {
      // 短辺に合わせて中央を切り出す（プレビューの slice と同じ）
      const scale = Math.max(photoW / img.width, photoH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(m, photoTop, photoW, photoH);
      ctx.clip();
      ctx.drawImage(img, m + (photoW - dw) / 2, photoTop + (photoH - dh) / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = PALETTE.paperEdge;
      ctx.fillRect(m, photoTop, photoW, photoH);
    }

    ctx.textBaseline = 'alphabetic';

    // 上の帯
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `500 ${W * 0.026}px ${SANS}`;
    (ctx as any).letterSpacing = `${W * 0.026 * 0.4}px`;
    ctx.fillText('MY JAPAN', m, m * 0.95);
    (ctx as any).letterSpacing = '0px';
    ctx.textAlign = 'right';
    ctx.font = `400 ${W * 0.026}px ${SANS}`;
    ctx.fillText(meta.dateLabel, W - m, m * 0.95);
    ctx.textAlign = 'left';

    // 下の帯
    ctx.fillStyle = PALETTE.matcha;
    ctx.font = `500 ${W * 0.03}px ${SANS}`;
    (ctx as any).letterSpacing = `${W * 0.03 * 0.22}px`;
    ctx.fillText(meta.prefecture.toUpperCase(), m, photoTop + photoH + W * 0.10);
    (ctx as any).letterSpacing = '0px';

    const titleSize = W * 0.062;
    const titleLines = wrapText(meta.title, titleSize, W - m * 2, 2);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${titleSize}px ${SERIF}`;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, m, photoTop + photoH + W * 0.19 + i * titleSize * 1.25);
    });

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `400 ${W * 0.03}px ${SANS}`;
    ctx.fillText(meta.place, m, photoTop + photoH + W * 0.255 + (titleLines.length - 1) * titleSize * 1.25);

    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `400 ${W * 0.026}px ${SANS}`;
    ctx.fillText('my-japan-matcha.com', m, H - m * 0.7);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
