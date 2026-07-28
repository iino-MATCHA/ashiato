/**
 * 「My Japan」カード（訪問した都道府県の割合）のPNG書き出し。
 * 画面のプレビューと同じ構成を canvas で 1080×1920 に描く。
 */
import { PREFECTURE_PATHS } from './mappath';
import { PREFECTURE_SLUG_BY_ID } from './prefectures';
import { PALETTE } from './ugc/layout';
import { VB_W, VB_H, pathBox } from './ugc/geo';

export interface JapanCardMeta {
  percent: number;
  count: number;
  total: number;
  rank: string;
  visitedCodes: number[];
}

const W = 1080;
const H = 1920;
const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;

export async function exportJapanCard(meta: JapanCardMeta): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const M = W * 0.085;

    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // 上段: ブランド + 割合
    ctx.fillStyle = PALETTE.matcha;
    ctx.font = `500 ${W * 0.029}px ${SANS}`;
    (ctx as any).letterSpacing = `${W * 0.029 * 0.28}px`;
    ctx.fillText('MY JAPAN · ASHIATO', M, M + W * 0.03);
    (ctx as any).letterSpacing = '0px';

    const pctSize = W * 0.15;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${pctSize}px ${SERIF}`;
    const pctText = `${meta.percent}%`;
    ctx.fillText(pctText, M, M + W * 0.175);
    const pctW = ctx.measureText(pctText).width;
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `400 ${W * 0.034}px ${SANS}`;
    ctx.fillText('of Japan', M + pctW + W * 0.015, M + W * 0.175);

    // 中段: 日本地図（沖縄は割合の絵なので出さない — プレビューと同じ）
    drawJapan(ctx, meta.visitedCodes, M, H * 0.26, W - M * 2, H * 0.44);

    // 下段: ランクと件数
    const baseY = H - M - W * 0.06;
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `500 ${W * 0.026}px ${SANS}`;
    (ctx as any).letterSpacing = `${W * 0.026 * 0.22}px`;
    ctx.fillText('RANK', M, baseY - W * 0.055);
    (ctx as any).letterSpacing = '0px';
    ctx.fillStyle = PALETTE.matcha;
    ctx.font = `700 ${W * 0.043}px ${SERIF}`;
    ctx.fillText(meta.rank, M, baseY);

    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `400 ${W * 0.026}px ${SANS}`;
    ctx.fillText('prefectures', W - M, baseY);
    const unit = ` / ${meta.total}`;
    ctx.font = `400 ${W * 0.03}px ${SANS}`;
    ctx.fillText(unit, W - M, baseY - W * 0.045);
    const unitW = ctx.measureText(unit).width;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${W * 0.072}px ${SERIF}`;
    ctx.fillText(String(meta.count), W - M - unitW, baseY - W * 0.045);
    ctx.textAlign = 'left';

    // 落款
    ctx.fillStyle = PALETTE.inkFaint;
    ctx.globalAlpha = 0.45;
    ctx.font = `700 ${W * 0.04}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText('足跡', W / 2, H - M * 0.45);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** 指定の矩形に日本地図を収めて描く。 */
function drawJapan(
  ctx: CanvasRenderingContext2D,
  visitedCodes: number[],
  x: number, y: number, w: number, h: number
) {
  // 沖縄を除いた本土の外接矩形に合わせる
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    if (slug === 'okinawa') return;
    const b = pathBox(d);
    minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
  });
  if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = VB_W; maxY = VB_H; }

  const srcW = maxX - minX;
  const srcH = maxY - minY;
  const scale = Math.min(w / srcW, h / srcH);
  const visited = new Set(visitedCodes);

  ctx.save();
  ctx.translate(x + (w - srcW * scale) / 2, y + (h - srcH * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1 / scale;
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    if (slug === 'okinawa') return;
    const code = PREFECTURE_SLUG_BY_ID.findIndex((s) => s === slug);
    const path = new Path2D(d);
    ctx.fillStyle = visited.has(code) ? PALETTE.matcha : PALETTE.land;
    ctx.fill(path);
    ctx.strokeStyle = PALETTE.border;
    ctx.stroke(path);
  });
  ctx.restore();
}
