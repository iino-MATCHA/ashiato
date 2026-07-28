/**
 * 台割を実際のページ画像にして、PDFに綴じる（Web）。
 *
 * 文字はフォント埋め込みではなく canvas で焼き込む。理由は、日本語フォントを
 * PDFに埋め込むとサブセット化が必要でファイルも重くなるうえ、
 * ここでは写真が主役で文字量が少ないため、焼き込みで実用上困らないこと。
 *
 * 割付の型は docs/photobook.md の §4。均等な2×2は使わない。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID } from '@/lib/prefectures';
import { jsPDF } from 'jspdf';
import { pathBox, project } from '@/lib/ugc/geo';
import type { BookPlan, Page, PagePhoto } from './plan';

/** A5 / 200dpi。写真主体の本なら十分で、枚数が増えても破綻しない。 */
const PW = 1165;
const PH = 1654;
const M = Math.round(PW * 0.085);

const SERIF = `'ShipporiMincho_700Bold', 'Shippori Mincho', serif`;
const SERIF_R = `'ShipporiMincho_400Regular', 'Shippori Mincho', serif`;
const SANS = `'ZenKakuGothicNew_500Medium', 'Zen Kaku Gothic New', system-ui, sans-serif`;
const BRUSH = `'YujiSyuku_400Regular', serif`;

const INK = '#1B1815';
const SOFT = '#6B6862';
const FAINT = '#A5A19A';
const RULE = '#DAD7D0';
const PAPER = '#FBFAF7';
const MATCHA = '#69AF00';

export interface RenderProgress { done: number; total: number }

/** 1ページをPNGのdataURLにする（プレビュー用）。 */
export async function renderPage(plan: BookPlan, index: number): Promise<string | null> {
  const canvas = await paint(plan, index);
  return canvas ? canvas.toDataURL('image/jpeg', 0.9) : null;
}

/** 全ページを綴じてPDFのBlobを返す。 */
export async function renderPdf(
  plan: BookPlan,
  onProgress?: (p: RenderProgress) => void
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    const doc = new jsPDF({ unit: 'px', format: [PW, PH], compress: true });
    for (let i = 0; i < plan.pages.length; i++) {
      const canvas = await paint(plan, i);
      if (!canvas) continue;
      if (i > 0) doc.addPage([PW, PH]);
      doc.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, PW, PH);
      onProgress?.({ done: i + 1, total: plan.pages.length });
    }
    return doc.output('blob');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- ページ描画

async function paint(plan: BookPlan, index: number): Promise<HTMLCanvasElement | null> {
  const page = plan.pages[index];
  if (!page) return null;
  const canvas = document.createElement('canvas');
  canvas.width = PW;
  canvas.height = PH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, PW, PH);

  switch (page.kind) {
    case 'cover': await paintCover(ctx, page); break;
    case 'map': paintMap(ctx, page); break;
    case 'itinerary': paintItinerary(ctx, page); break;
    case 'photos': await paintPhotos(ctx, page); break;
    case 'colophon': paintColophon(ctx, page); break;
  }

  // 通し帯（表紙以外）。全行程を1本の線にして現在地に点を打つ
  if (page.kind !== 'cover') paintRibbon(ctx, plan, page.progress);
  if (page.kind !== 'cover') {
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.018}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1), PW / 2, PH - M * 0.42);
    ctx.textAlign = 'left';
  }
  return canvas;
}

async function paintCover(ctx: CanvasRenderingContext2D, p: Extract<Page, { kind: 'cover' }>) {
  const img = await loadImage(p.hero);
  // 上3分の2に写真、下は余白（間）
  const h = Math.round(PH * 0.62);
  if (img) drawCover(ctx, img, 0, 0, PW, h);
  else { ctx.fillStyle = '#E8E7E1'; ctx.fillRect(0, 0, PW, h); }

  ctx.fillStyle = FAINT;
  ctx.font = `500 ${PW * 0.02}px ${SANS}`;
  (ctx as any).letterSpacing = `${PW * 0.02 * 0.35}px`;
  ctx.fillText('ASHIATO', M, h + M * 0.9);
  (ctx as any).letterSpacing = '0px';

  ctx.fillStyle = INK;
  const size = PW * 0.072;
  ctx.font = `700 ${size}px ${SERIF}`;
  wrap(ctx, p.title, M, h + M * 2.1, PW - M * 2, size * 1.35, 3);

  ctx.fillStyle = SOFT;
  ctx.font = `400 ${PW * 0.026}px ${SANS}`;
  ctx.fillText(p.dateLabel, M, PH - M);
}

function paintMap(ctx: CanvasRenderingContext2D, p: Extract<Page, { kind: 'map' }>) {
  heading(ctx, 'THE ROUTE', '行程');
  const top = M * 3.2;
  const h = PH - top - M * 2.4;
  drawJapan(ctx, p.visitedCodes, p.stops, M, top, PW - M * 2, h);
}

function paintItinerary(ctx: CanvasRenderingContext2D, p: Extract<Page, { kind: 'itinerary' }>) {
  heading(ctx, 'ITINERARY', '道中記');
  let y = M * 3.4;
  const lh = PW * 0.052;
  p.rows.forEach((r) => {
    if (y > PH - M * 2) return;
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.021}px ${SANS}`;
    ctx.fillText(r.date.replace(/-/g, '.'), M, y);
    ctx.fillStyle = INK;
    ctx.font = `400 ${PW * 0.028}px ${SERIF_R}`;
    ctx.fillText(r.placeEn, M + PW * 0.16, y);
    ctx.fillStyle = SOFT;
    ctx.font = `400 ${PW * 0.021}px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${r.prefEn} · ${r.transport}`, PW - M, y);
    ctx.textAlign = 'left';
    y += lh * 0.42;
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(PW - M, y);
    ctx.stroke();
    y += lh * 0.58;
  });
}

/** 章の帯: 県名のかな（筆）＋ EN ＋ 日付・節気。写真ページの上端に載せる */
function paintChapterBand(ctx: CanvasRenderingContext2D, c: NonNullable<Extract<Page, { kind: 'photos' }>['chapter']>) {
  const y = M * 1.15;
  ctx.fillStyle = INK;
  ctx.font = `400 ${PW * 0.052}px ${BRUSH}`;
  ctx.fillText(c.prefKana, M, y);
  const kw = ctx.measureText(c.prefKana).width;

  ctx.fillStyle = SOFT;
  ctx.font = `500 ${PW * 0.022}px ${SANS}`;
  (ctx as any).letterSpacing = `${PW * 0.022 * 0.28}px`;
  ctx.fillText(c.prefEn.toUpperCase() + (c.visitNo > 1 ? ` · ${c.visitNo}` : ''), M + kw + PW * 0.03, y - PW * 0.004);
  (ctx as any).letterSpacing = '0px';

  ctx.fillStyle = FAINT;
  ctx.font = `400 ${PW * 0.019}px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${c.dateLabel}${c.sekki ? '   ' + c.sekki : ''}`, PW - M, y - PW * 0.004);
  ctx.textAlign = 'left';

  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, y + M * 0.45); ctx.lineTo(PW - M, y + M * 0.45); ctx.stroke();
}

async function paintPhotos(ctx: CanvasRenderingContext2D, p: Extract<Page, { kind: 'photos' }>) {
  const imgs = (await Promise.all(p.photos.map((ph) => loadImage(ph.uri)))).filter(Boolean) as HTMLImageElement[];
  if (p.chapter) paintChapterBand(ctx, p.chapter);
  if (!imgs.length) {
    // 読み込みに全滅したときも白紙にはしない
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.024}px ${SANS}`;
    ctx.fillText(p.place, M, PH / 2);
    return;
  }

  const top = p.chapter ? M * 2.2 : M * 1.2;
  const areaH = PH - top - M * 3.2;

  if (imgs.length === 1) {
    const img = imgs[0];
    const portrait = img.height >= img.width;
    if (portrait) {
      // 縦1枚: 片側に寄せ、余白に文字（間）
      const w = (PW - M * 2) * 0.66;
      const h = Math.min(areaH, w * (img.height / img.width));
      drawCover(ctx, img, M, top, w, h);
    } else {
      // 横1枚: 天地中央に裁ち落とし
      const w = PW;
      const h = Math.min(areaH, w * (img.height / img.width));
      drawCover(ctx, img, 0, top + (areaH - h) / 2, w, h);
    }
  } else if (imgs.length === 2) {
    const gap = M * 0.5;
    const h = (areaH - gap) / 2;
    // 主従をつける: 上を大きく
    const h1 = h * 1.25;
    const h2 = areaH - gap - h1;
    drawCover(ctx, imgs[0], M, top, PW - M * 2, h1);
    drawCover(ctx, imgs[1], M, top + h1 + gap, (PW - M * 2) * 0.62, h2);
  } else {
    // 3枚: 主1 + 従2（均等グリッドにしない）
    const gap = M * 0.45;
    const hMain = areaH * 0.58;
    drawCover(ctx, imgs[0], M, top, PW - M * 2, hMain);
    const wSub = (PW - M * 2 - gap) / 2;
    const hSub = areaH - hMain - gap;
    drawCover(ctx, imgs[1], M, top + hMain + gap, wSub, hSub);
    drawCover(ctx, imgs[2], M + wSub + gap, top + hMain + gap, wSub, hSub);
  }

  ctx.fillStyle = FAINT;
  ctx.font = `500 ${PW * 0.02}px ${SANS}`;
  (ctx as any).letterSpacing = `${PW * 0.02 * 0.25}px`;
  ctx.fillText(p.place.toUpperCase(), M, PH - M * 2.05);
  (ctx as any).letterSpacing = '0px';
  if (p.caption) {
    ctx.fillStyle = SOFT;
    ctx.font = `400 ${PW * 0.024}px ${SERIF_R}`;
    wrap(ctx, p.caption, M, PH - M * 1.5, PW - M * 2, PW * 0.034, 2);
  }
}

function paintColophon(ctx: CanvasRenderingContext2D, p: Extract<Page, { kind: 'colophon' }>) {
  heading(ctx, 'COLOPHON', '奥付');
  let y = PH * 0.34;
  p.stats.forEach(([label, value]) => {
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.022}px ${SANS}`;
    ctx.fillText(label, M, y);
    ctx.fillStyle = INK;
    ctx.font = `700 ${PW * 0.038}px ${SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText(value, PW - M, y);
    ctx.textAlign = 'left';
    y += PW * 0.075;
    ctx.strokeStyle = RULE;
    ctx.beginPath(); ctx.moveTo(M, y - PW * 0.03); ctx.lineTo(PW - M, y - PW * 0.03); ctx.stroke();
  });
  ctx.fillStyle = FAINT;
  ctx.font = `700 ${PW * 0.034}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.5;
  ctx.fillText('足跡', PW / 2, PH - M * 2.4);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------- 部品

/** 全ページ下端の通し帯。折本を開いたときの連続性を綴じ本で真似る。 */
function paintRibbon(ctx: CanvasRenderingContext2D, plan: BookPlan, progress: number) {
  const y = PH - M * 0.95;
  const x0 = M;
  const x1 = PW - M;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();

  plan.stopProgress.forEach((t) => {
    ctx.beginPath();
    ctx.arc(x0 + t * (x1 - x0), y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = RULE;
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(x0 + progress * (x1 - x0), y, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = MATCHA;
  ctx.fill();
}

function heading(ctx: CanvasRenderingContext2D, en: string, ja: string) {
  ctx.fillStyle = FAINT;
  ctx.font = `500 ${PW * 0.02}px ${SANS}`;
  (ctx as any).letterSpacing = `${PW * 0.02 * 0.35}px`;
  ctx.fillText(en, M, M * 1.1);
  (ctx as any).letterSpacing = '0px';
  ctx.fillStyle = INK;
  ctx.font = `700 ${PW * 0.042}px ${SERIF}`;
  ctx.fillText(ja, M, M * 2.1);
}

/** 枠に合わせて中央を切り出して描く（cover 相当）。 */
function drawCover(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawJapan(
  ctx: CanvasRenderingContext2D,
  visitedCodes: number[],
  stops: { lat: number; lng: number }[],
  x: number, y: number, w: number, h: number
) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    if (slug === 'okinawa') return;
    const b = pathBox(d);
    minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
  });
  const srcW = maxX - minX;
  const srcH = maxY - minY;
  const scale = Math.min(w / srcW, h / srcH);
  const ox = x + (w - srcW * scale) / 2;
  const oy = y + (h - srcH * scale) / 2;
  const visited = new Set(visitedCodes);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1 / scale;
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    if (slug === 'okinawa') return;
    const code = PREFECTURE_SLUG_BY_ID.findIndex((s) => s === slug);
    const path = new Path2D(d);
    ctx.fillStyle = visited.has(code) ? '#DCE9C4' : '#EDECE7';
    ctx.fill(path);
    ctx.strokeStyle = RULE;
    ctx.stroke(path);
  });
  ctx.restore();

  stops.forEach((s) => {
    const p = project(s.lat, s.lng);
    const px = ox + (p.x - minX) * scale;
    const py = oy + (p.y - minY) * scale;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = MATCHA;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** 日本語は空白が無いので、収まらない語は1文字ずつ送る。 */
function wrap(
  ctx: CanvasRenderingContext2D, text: string,
  x: number, y: number, maxW: number, lh: number, maxLines: number
) {
  const tokens: string[] = [];
  text.split(/\s+/).forEach((word, i, arr) => {
    if (ctx.measureText(word).width <= maxW) tokens.push(i < arr.length - 1 ? `${word} ` : word);
    else Array.from(word).forEach((ch) => tokens.push(ch));
  });
  const lines: string[] = [];
  let line = '';
  for (const tk of tokens) {
    const next = line + tk;
    if (ctx.measureText(next.trimEnd()).width > maxW && line) {
      lines.push(line.trimEnd());
      if (lines.length === maxLines) { line = ''; break; }
      line = tk;
    } else line = next;
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trimEnd());
  const cut = lines.join('').length < text.replace(/\s+/g, '').length;
  lines.forEach((l, i) => {
    const last = i === lines.length - 1;
    ctx.fillText(last && cut ? `${l}…` : l, x, y + i * lh);
  });
}

export const PAGE_SIZE = { width: PW, height: PH };
export type { PagePhoto };
