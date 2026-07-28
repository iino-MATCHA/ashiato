/**
 * シェアカードの書き出し（Web）。
 * プレビューと同じ scene を canvas に描いて 1080×1920 の PNG を1枚作る。
 * 以前は mapbox の canvas をそのまま保存していたので地図しか残らなかった。
 */
import { buildScene } from './ugc/scene';
import { PALETTE } from './ugc/layout';

export interface ShareCardMeta {
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: { lat: number; lng: number; image: string }[];
  visitedPrefectureCodes: number[];
}

const W = 1080;

const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;

export async function exportShareCard(meta: ShareCardMeta): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const s = buildScene({
      width: W,
      stops: meta.stops,
      visitedPrefectureCodes: meta.visitedPrefectureCodes,
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(s.w);
    canvas.height = Math.round(s.h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 先に画像をすべて読み込む（1枚失敗しても他は描く）
    const pinImgs = await Promise.all(s.pins.map((p) => loadImage(p.uri)));

    // 地
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, s.w, s.h);

    // 日本地図
    ctx.save();
    ctx.translate(s.map.tx, s.map.ty);
    ctx.scale(s.map.scale, s.map.scale);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1 / s.map.scale;
    s.paths.forEach((p) => {
      ctx.save();
      if (p.okinawa) ctx.translate(s.okinawa.dx, s.okinawa.dy);
      const path = new Path2D(p.d);
      ctx.fillStyle = p.visited ? PALETTE.landVisited : PALETTE.land;
      ctx.fill(path);
      ctx.strokeStyle = PALETTE.border;
      ctx.stroke(path);
      ctx.restore();
    });
    ctx.restore();

    // 地点の写真
    s.pins.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.09, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.pinRing;
      ctx.fill();

      const img = pinImgs[i];
      if (img) drawCircularImage(ctx, img, p.x, p.y, p.r);
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.paperEdge;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 四隅の文字
    const t = s.text;
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `500 ${t.eyebrow.size}px ${SANS}`;
    (ctx as any).letterSpacing = `${t.eyebrow.size * 0.4}px`;
    ctx.fillText('ASHIATO', t.eyebrow.x, t.eyebrow.y);
    (ctx as any).letterSpacing = '0px';

    ctx.font = `400 ${t.dates.size}px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText(meta.dateLabel, t.dates.x, t.dates.y);
    ctx.textAlign = 'left';

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${t.title.size}px ${SERIF}`;
    fitText(ctx, meta.title, t.title.x, t.title.y, t.title.maxW);

    const stats: [string, string][] = [
      [String(meta.prefectures), 'pref'],
      [String(meta.days), 'days'],
      [meta.km.toLocaleString(), 'km'],
    ];
    stats.forEach(([value, label], i) => {
      const x = t.stats.x + i * t.stats.gap * 2.1;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${t.stats.size}px ${SERIF}`;
      ctx.fillText(value, x, t.stats.y);
      const vw = ctx.measureText(value).width;
      ctx.fillStyle = PALETTE.inkFaint;
      ctx.font = `400 ${t.stats.size * 0.72}px ${SANS}`;
      ctx.fillText(label, x + vw + t.stats.size * 0.3, t.stats.y);
    });

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** 正方形にトリミングして円に収める。 */
function drawCircularImage(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  cx: number, cy: number, r: number
) {
  const side = Math.min(img.width, img.height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Supabase Storage は CORS 許可済み
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** 収まらなければ字を詰め、それでも無理なら省略する（題は1行で通す）。 */
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number) {
  if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
  const base = ctx.font;
  const size = parseFloat(base);
  for (let s = size; s > size * 0.6; s -= 2) {
    ctx.font = base.replace(/[\d.]+px/, `${s}px`);
    if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
  }
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
  ctx.fillText(`${cut}…`, x, y);
}
