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

    // 2. 上下のスクリム（文字を読ませるため）
    paintScrim(ctx, 0, 0, W, 460, 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
    paintScrim(ctx, 0, H - 620, W, 620, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.72)');

    // 3. 左上: ブランド + タイトル
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `600 30px ${SANS}`;
    // letterSpacing は比較的新しいAPI。型に無いのでキャストして、非対応でも落ちないようにする
    (ctx as any).letterSpacing = '8px';
    ctx.fillText('ASHIATO', 84, 130);
    (ctx as any).letterSpacing = '0px';

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 74px ${SERIF}`;
    wrapText(ctx, meta.title, 84, 226, W - 168, 88, 2);

    // 4. 左下: スタッツ
    let y = H - 300;
    const stats: [string, string][] = [
      [String(meta.prefectures), 'prefectures visited'],
      [String(meta.days), 'days'],
      [`${meta.km.toLocaleString()} km`, 'distance travelled'],
    ];
    stats.forEach(([value, label]) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 58px ${SERIF}`;
      ctx.fillText(value, 84, y);
      const vw = ctx.measureText(value).width;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `400 30px ${SANS}`;
      ctx.fillText(label, 84 + vw + 18, y - 4);
      y += 86;
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

function paintScrim(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  from: string, to: string
) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** アイコン（丸くクリップ）＋表示名＋@ユーザー名を右下に。 */
async function paintAuthor(ctx: CanvasRenderingContext2D, meta: ShareCardMeta) {
  const r = 46;
  const cx = W - 84 - r;
  const cy = H - 150;

  const img = meta.avatarUrl ? await loadImage(meta.avatarUrl) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
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
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 34px ${SERIF}`;
  ctx.fillText(meta.authorName, cx - r - 26, cy - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(`@${meta.authorHandle}`, cx - r - 26, cy + 34);
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

/** maxLines 行までで折り返す。溢れたら … を付ける。 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  lines.forEach((l, i) => {
    const last = i === lines.length - 1;
    const overflow = last && lines.length === maxLines && ctx.measureText(text).width > maxWidth * maxLines;
    ctx.fillText(overflow ? `${l}…` : l, x, y + i * lineHeight);
  });
}
