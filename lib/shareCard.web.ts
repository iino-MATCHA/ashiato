/**
 * シェアカードの書き出し（Web）。
 * 画面のプレビューをそのまま保存すると小さくて粗いので、1080×1920 で地図を
 * もう一度描き直し、その上にタイトル・スタッツ・プロフィールアイコンを
 * canvas で合成して1枚のPNGにする。
 */
import { loadMapboxGL } from './mapbox';
import { buildShareMap } from '@/components/map/ShareMap';
import type { Step } from './mock';

export interface ShareCardMeta {
  title: string;
  prefectures: number;
  days: number;
  km: number;
  authorName: string;
  authorHandle: string;
  avatarUrl?: string;
}

const W = 1080;
const H = 1920;

export async function exportShareCard(steps: Step[], meta: ShareCardMeta): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  // 画面外に実サイズのコンテナを作って地図を描く
  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;`;
  document.body.appendChild(holder);

  let map: any = null;
  try {
    const mapboxgl = await loadMapboxGL();
    map = await buildShareMap(mapboxgl, holder, steps);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. 地図
    const mapCanvas: HTMLCanvasElement = map.getCanvas();
    ctx.drawImage(mapCanvas, 0, 0, W, H);

    // 2. 上下の暗幕。3点のグラデーションで端に線が出ないようにする（画面側と同じ配色）
    paintScrim(ctx, 0, H * 0.34, [
      [0, 'rgba(4,10,20,0.78)'], [0.55, 'rgba(4,10,20,0.42)'], [1, 'rgba(4,10,20,0)'],
    ]);
    paintScrim(ctx, H * (1 - 0.42), H * 0.42, [
      [0, 'rgba(4,10,20,0)'], [0.45, 'rgba(4,10,20,0.55)'], [1, 'rgba(4,10,20,0.88)'],
    ]);

    // 3. 左上: ブランド + タイトル + 罫
    const M = 90;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 28px ${SANS}`;
    // letterSpacing は比較的新しいAPI。型に無いのでキャストして、非対応でも落ちないようにする
    (ctx as any).letterSpacing = '11px';
    ctx.fillText('ASHIATO', M, 132);
    (ctx as any).letterSpacing = '0px';

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 76px ${SERIF}`;
    const lines = wrapText(ctx, meta.title, M, 232, W - M * 2, 92, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(M, 232 + (lines - 1) * 92 + 40, 82, 3);

    // 4. 左下: スタッツ
    let y = H - 310;
    const stats: [string, string][] = [
      [String(meta.prefectures), 'prefectures'],
      [String(meta.days), 'days'],
      [meta.km.toLocaleString(), 'km travelled'],
    ];
    stats.forEach(([value, label]) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 62px ${SERIF}`;
      ctx.fillText(value, M, y);
      const vw = ctx.measureText(value).width;
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = `400 28px ${SANS}`;
      ctx.fillText(label, M + vw + 22, y - 5);
      y += 92;
    });

    // 5. 右下: プロフィールアイコンと名前
    await paintAuthor(ctx, meta);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    try { map?.remove(); } catch {}
    holder.remove();
  }
}

const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;

/** 縦方向のグラデーション帯。stops は [位置(0..1), 色] の並び。 */
function paintScrim(
  ctx: CanvasRenderingContext2D,
  y: number, h: number,
  stops: [number, string][]
) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, h);
}

/** 右下にアイコン（丸くクリップ）、その下に名前。画面のカードと同じ配置。 */
async function paintAuthor(ctx: CanvasRenderingContext2D, meta: ShareCardMeta) {
  const r = 58;
  const cx = W - 90 - r;
  const cy = H - 240;

  const img = meta.avatarUrl ? await loadImage(meta.avatarUrl) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.clip();
  if (img) {
    // 正方形にトリミングして丸に収める
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(meta.authorName, cx, cy + r + 40);
  ctx.textAlign = 'left';
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Supabase Storage は CORS 許可済み
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * maxLines 行までで折り返して描き、描いた行数を返す。
 * 日本語のタイトルは空白が無く単語分割では折り返せないので、
 * 幅に収まらない語はさらに1文字ずつ送る。
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines: number
): number {
  const tokens: string[] = [];
  text.split(/\s+/).forEach((word, i, arr) => {
    if (ctx.measureText(word).width <= maxWidth) {
      tokens.push(i < arr.length - 1 ? `${word} ` : word);
    } else {
      // 長すぎる語（＝日本語の連なり）は1文字ずつ
      Array.from(word).forEach((ch) => tokens.push(ch));
    }
  });

  const lines: string[] = [];
  let line = '';
  for (const tk of tokens) {
    const next = line + tk;
    if (ctx.measureText(next.trimEnd()).width > maxWidth && line) {
      lines.push(line.trimEnd());
      if (lines.length === maxLines) { line = ''; break; }
      line = tk;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trimEnd());

  const truncated = lines.join('').length < text.replace(/\s+/g, '').length;
  lines.forEach((l, i) => {
    const last = i === lines.length - 1;
    ctx.fillText(last && truncated ? `${l}…` : l, x, y + i * lineHeight);
  });
  return lines.length || 1;
}
