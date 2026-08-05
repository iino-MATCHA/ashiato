/**
 * シェアカードの書き出し（Web）。
 * プレビューと同じ scene を canvas に描いて 1080×1920 の PNG を1枚作る。
 * 以前は mapbox の canvas をそのまま保存していたので地図しか残らなかった。
 */
import { buildScene, type SceneStop } from './ugc/scene';
import { PALETTE } from './ugc/layout';

export interface ShareCardMeta {
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: SceneStop[];
  visitedPrefectureCodes: number[];
  /** ポラロイドに添える地名 */
  coverCaption?: string;
}

const W = 1080;

const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;
const HAND = `'Caveat_400Regular', 'Caveat', cursive`;
const HAND_B = `'Caveat_600SemiBold', 'Caveat', cursive`;

/** 傾けて描く。中心を軸にするのはプレビューの rotate と合わせるため */
function tilted(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, deg: number, draw: () => void
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
}

/** 短辺に合わせて中央を切り出す（プレビューの slice と同じ） */
function drawCover(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export async function exportShareCard(meta: ShareCardMeta): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const s = buildScene({
      width: W,
      stops: meta.stops,
      visitedPrefectureCodes: meta.visitedPrefectureCodes,
      coverCaption: meta.coverCaption,
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(s.w);
    canvas.height = Math.round(s.h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 先に画像をすべて読み込む（1枚失敗しても他は描く）
    const pinImgs = await Promise.all(s.pins.map((p) => loadImage(p.uri)));
    const frameImgs = await Promise.all(s.frames.map((f) => loadImage(f.uri)));

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

    const B = W * 0.013; // ポラロイドの白い縁

    // 付箋から地点へ伸びる破線。紙より先に敷く
    ctx.save();
    ctx.strokeStyle = PALETTE.thread;
    ctx.lineWidth = W * 0.004;
    ctx.lineCap = 'round';
    ctx.setLineDash([W * 0.012, W * 0.012]);
    s.tags.forEach((tg) => {
      ctx.beginPath();
      ctx.moveTo(tg.fromX, tg.fromY);
      ctx.lineTo(tg.toX, tg.toY);
      ctx.stroke();
    });
    ctx.restore();

    // 地点の丸写真
    s.pins.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.note;
      ctx.fill();
      const img = pinImgs[i];
      if (img) drawCircularImage(ctx, img, p.x, p.y, p.r);
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.paperEdge;
        ctx.fill();
      }
    });

    // 日付の付箋
    s.tags.forEach((tg) => {
      tilted(ctx, tg.x + tg.w / 2, tg.y + tg.h / 2, tg.rotate, () => {
        ctx.fillStyle = PALETTE.note;
        ctx.fillRect(tg.x, tg.y, tg.w, tg.h);
        ctx.strokeStyle = PALETTE.noteEdge;
        ctx.lineWidth = W * 0.002;
        ctx.strokeRect(tg.x, tg.y, tg.w, tg.h);

        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.noteInk;
        ctx.font = `600 ${W * 0.040}px ${HAND_B}`;
        ctx.fillText(tg.day, tg.x + tg.w / 2, tg.y + tg.h * 0.44);
        ctx.font = `400 ${W * 0.038}px ${HAND}`;
        ctx.fillText(tg.place, tg.x + tg.w / 2, tg.y + tg.h * 0.80);
        ctx.textAlign = 'left';
      });
    });

    // ポラロイド
    s.frames.forEach((f, i) => {
      tilted(ctx, f.x + f.w / 2, f.y + f.h / 2, f.rotate, () => {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = W * 0.03;
        ctx.shadowOffsetY = W * 0.008;
        ctx.fillStyle = PALETTE.note;
        ctx.fillRect(f.x - B, f.y - B, f.w + B * 2, f.h + B * 2 + W * 0.062);
        ctx.restore();

        const img = frameImgs[i];
        if (img) drawCover(ctx, img, f.x, f.y, f.w, f.h);
        else {
          ctx.fillStyle = PALETTE.paperEdge;
          ctx.fillRect(f.x, f.y, f.w, f.h);
        }
        if (f.caption) {
          ctx.textAlign = 'center';
          ctx.fillStyle = PALETTE.noteInk;
          ctx.font = `400 ${W * 0.042}px ${HAND}`;
          ctx.fillText(f.caption, f.x + f.w / 2, f.y + f.h + W * 0.050);
          ctx.textAlign = 'left';
        }
      });
    });

    // 四隅の文字
    const t = s.text;
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = PALETTE.inkFaint;
    ctx.font = `500 ${t.eyebrow.size}px ${SANS}`;
    (ctx as any).letterSpacing = `${t.eyebrow.size * 0.4}px`;
    ctx.fillText('MY JAPAN', t.eyebrow.x, t.eyebrow.y);
    (ctx as any).letterSpacing = '0px';

    ctx.font = `400 ${t.dates.size}px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText(meta.dateLabel, t.dates.x, t.dates.y);
    ctx.textAlign = 'left';

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${t.title.size}px ${SERIF}`;
    fitText(ctx, meta.title, t.title.x, t.title.y, t.title.maxW);

    ctx.fillStyle = PALETTE.matcha;
    ctx.font = `400 ${t.subtitle.size}px ${HAND}`;
    ctx.fillText('A journey of memories', t.subtitle.x, t.subtitle.y);

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

    // 下の便箋
    const n = t.note;
    tilted(ctx, n.x + n.w / 2, n.y + n.h / 2, -1.5, () => {
      ctx.fillStyle = PALETTE.note;
      ctx.fillRect(n.x, n.y, n.w, n.h);
      n.lines.forEach((line, i) => {
        const y = n.y + n.h * 0.24 + i * n.size * 1.28;
        ctx.strokeStyle = PALETTE.noteEdge;
        ctx.lineWidth = W * 0.0015;
        ctx.beginPath();
        ctx.moveTo(n.x + W * 0.02, y + n.size * 0.22);
        ctx.lineTo(n.x + n.w - W * 0.02, y + n.size * 0.22);
        ctx.stroke();
        ctx.fillStyle = PALETTE.noteInk;
        ctx.font = `400 ${n.size}px ${HAND}`;
        ctx.fillText(line, n.x + W * 0.035, y);
      });
      ctx.fillStyle = PALETTE.matcha;
      ctx.font = `600 ${n.size}px ${HAND_B}`;
      ctx.fillText('My Japan', n.x + W * 0.035, n.y + n.h * 0.24 + 3 * n.size * 1.28);
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
