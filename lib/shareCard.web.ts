/**
 * シェアカードの書き出し（Web）。
 * プレビューと同じ scene を canvas に描いて 1080×1920 の PNG を1枚作る。
 * 以前は mapbox の canvas をそのまま保存していたので地図しか残らなかった。
 */
import { buildScene, type SceneStop } from './ugc/scene';
import { PALETTE, PHOTO } from './ugc/layout';

export interface ShareCardMeta {
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: SceneStop[];
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
    const [pinImgs, photoImgs] = await Promise.all([
      Promise.all(s.pins.map((p) => loadImage(p.uri))),
      Promise.all(s.photos.map((p) => loadImage(p.uri))),
    ]);

    // 地
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, s.w, s.h);

    // 地の模様になる大判写真。**地図より先に**敷き、薄く沈める
    // （プレビュー側 JourneyCard と同じ順・同じ濃さ）
    s.photos.forEach((p, i) => {
      const img = photoImgs[i];
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = PHOTO.opacity;
      ctx.translate(p.cx, p.cy);
      ctx.rotate((p.rot * Math.PI) / 180);
      const rr = () => roundedRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.radius);
      ctx.save();
      rr();
      ctx.clip();
      // 中央を切って角丸の枠いっぱいに敷く
      const scale = Math.max(p.w / img.width, p.h / img.height);
      const sw = p.w / scale;
      const sh = p.h / scale;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, -p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      ctx.restore();
    });

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

    // 地点の丸写真。縁を敷いて、県の塗りから切り離す
    s.pins.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.1, 0, Math.PI * 2);
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

    // 数字は大きく、単位は小さく添える。実測幅で流す
    const stats: [string, string][] = [
      [String(meta.prefectures), 'pref'],
      [String(meta.days), 'days'],
      [meta.km.toLocaleString(), 'km'],
    ];
    let sx = t.stats.x;
    stats.forEach(([value, label]) => {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${t.stats.size}px ${SERIF}`;
      ctx.fillText(value, sx, t.stats.y);
      const vw = ctx.measureText(value).width;
      ctx.fillStyle = PALETTE.inkFaint;
      ctx.font = `400 ${t.stats.labelSize}px ${SANS}`;
      const lx = sx + vw + t.stats.size * 0.14;
      ctx.fillText(label, lx, t.stats.y);
      sx = lx + ctx.measureText(label).width + t.stats.size * 0.5;
    });

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** 角丸の矩形パス。ctx.roundRect の無い環境でも動くように自前で引く。 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
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
/**
 * 入りきらない題を縮めて描く。縮めても駄目なら末尾を落とす。
 *
 * **文字の大きさは font 文字列から px を取り出して読む。**
 * parseFloat(ctx.font) だと "700 88px ..." の先頭の太さ 700 を拾い、
 * 700px から縮めるつもりで探すのでいつまでも収まらず、
 * 縮まずにいきなり「Two weeks in Kyo…」と切れていた（プレビューは
 * 収まっているのに書き出しだけ切れる、という食い違いの正体）。
 * 縮め方も JourneyCard 側の fitTitleSize と同じ式に揃える。
 */
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number) {
  const base = ctx.font;
  const w0 = ctx.measureText(text).width;
  if (w0 <= maxW) { ctx.fillText(text, x, y); return; }
  const size = parseFloat(/([\d.]+)px/.exec(base)?.[1] ?? '16');
  /**
   * ぴったり maxW になる大きさを出すと、丸めで 896.400001 > 896.4 と
   * 判定されて縮小が空振りし、そのまま末尾が落ちていた（実測）。
   * 1%だけ余らせる。
   */
  const shrunk = Math.max(size * 0.45, (size * maxW) / w0 * 0.99);
  ctx.font = base.replace(/[\d.]+px/, `${shrunk}px`);
  if (ctx.measureText(text).width <= maxW) { ctx.fillText(text, x, y); return; }
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
  ctx.fillText(`${cut}…`, x, y);
}
