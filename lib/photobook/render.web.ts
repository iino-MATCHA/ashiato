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

/** 全ページを綴じてPDFのBlobを返す（画面で読む用）。 */
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

/**
 * 印刷所へ渡すPDF。
 *
 * 画面で読むPDFとは別物として作る。違いは3つ。
 *   1. **解像度** — A5を300dpiで組む（画面用は200dpi相当）。
 *      文字の輪郭と写真の粒が、紙にしたときに耐えるのはここから。
 *   2. **塗り足し** — 仕上がりの外側へ3mm分、地を伸ばす。
 *      断裁は必ずわずかにズレるので、これが無いと端に白が出る。
 *   3. **トンボ** — どこで断つかを四隅に示す。
 *
 * **色は RGB のまま**渡す。ブラウザの canvas は CMYK を持てないので、
 * ここで変換したふりをしても嘘になる。印刷所側の profile 変換に任せ、
 * 「RGB入稿」であることを先方に伝えること。
 * （沈むのが困る色は、刷り出しを見てから元の色を調整する）
 */
const PRINT_SCALE = 1.5;                    // 200dpi → 300dpi
const BLEED = Math.round((3 / 148) * PW);   // A5の短辺148mmに対する3mm
const MARK = Math.round(BLEED * 1.6);       // トンボの線の長さ

export async function renderPrintPdf(
  plan: BookPlan,
  onProgress?: (p: RenderProgress) => void
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    const trimW = PW * PRINT_SCALE;
    const trimH = PH * PRINT_SCALE;
    const bleed = BLEED * PRINT_SCALE;
    const sheetW = Math.round(trimW + bleed * 2);
    const sheetH = Math.round(trimH + bleed * 2);

    const doc = new jsPDF({ unit: 'px', format: [sheetW, sheetH], compress: true });
    for (let i = 0; i < plan.pages.length; i++) {
      const canvas = await paint(plan, i, PRINT_SCALE);
      if (!canvas) continue;
      if (i > 0) doc.addPage([sheetW, sheetH]);

      // 地を塗ってから、仕上がり位置に本文を置く。
      // 外側の3mmは本文をそのまま引き伸ばさず、地の色で埋める
      // （縁に写真が来る面付けは今のところ無い）。
      doc.setFillColor(PAPER);
      doc.rect(0, 0, sheetW, sheetH, 'F');
      // 画質優先。ここを JPEG で落とすと、紙にしたとき文字の縁が濁る
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', bleed, bleed, trimW, trimH);
      drawCropMarks(doc, sheetW, sheetH, bleed);

      onProgress?.({ done: i + 1, total: plan.pages.length });
    }
    return doc.output('blob');
  } catch {
    return null;
  }
}

/** 四隅のトンボ。仕上がり線の延長を、塗り足しの外側に短く引く */
function drawCropMarks(doc: any, sheetW: number, sheetH: number, bleed: number) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  const L = MARK * PRINT_SCALE;
  const x0 = bleed;
  const y0 = bleed;
  const x1 = sheetW - bleed;
  const y1 = sheetH - bleed;
  const seg = (ax: number, ay: number, bx: number, by: number) => doc.line(ax, ay, bx, by);
  // 左上
  seg(0, y0, Math.max(0, x0 - L * 0.15), y0);
  seg(x0, 0, x0, Math.max(0, y0 - L * 0.15));
  // 右上
  seg(sheetW, y0, x1 + L * 0.15, y0);
  seg(x1, 0, x1, Math.max(0, y0 - L * 0.15));
  // 左下
  seg(0, y1, Math.max(0, x0 - L * 0.15), y1);
  seg(x0, sheetH, x0, y1 + L * 0.15);
  // 右下
  seg(sheetW, y1, x1 + L * 0.15, y1);
  seg(x1, sheetH, x1, y1 + L * 0.15);
}

// ---------------------------------------------------------------- ページ描画

async function paint(plan: BookPlan, index: number, scale = 1): Promise<HTMLCanvasElement | null> {
  const page = plan.pages[index];
  if (!page) return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PW * scale);
  canvas.height = Math.round(PH * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // 以降の描画は 1165x1654 の座標のまま書けるようにする。
  // 印刷用のときだけ倍率がかかり、線も文字も素直に太くなる
  if (scale !== 1) ctx.scale(scale, scale);

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
  const imgs = (await Promise.all(p.photos.map(loadImage))).filter(Boolean) as HTMLImageElement[];

  // 主写真1枚 ＋ その下に帯（最大3枚）。1枚しか無ければ従来どおり大きく1枚
  const mainH = Math.round(PH * (imgs.length > 1 ? 0.46 : 0.6));
  if (imgs[0]) drawCover(ctx, imgs[0], 0, 0, PW, mainH);
  else { ctx.fillStyle = '#E8E7E1'; ctx.fillRect(0, 0, PW, mainH); }

  let bottom = mainH;
  if (imgs.length > 1) {
    const strip = imgs.slice(1, 4);
    const gap = 6;
    const stripH = Math.round(PH * 0.155);
    const w = (PW - gap * (strip.length - 1)) / strip.length;
    strip.forEach((img, i) => drawCover(ctx, img, i * (w + gap), mainH + gap, w, stripH));
    bottom = mainH + gap + stripH;
  }

  ctx.fillStyle = FAINT;
  ctx.font = `500 ${PW * 0.02}px ${SANS}`;
  (ctx as any).letterSpacing = `${PW * 0.02 * 0.35}px`;
  ctx.fillText('MY JAPAN', M, bottom + M * 0.95);
  (ctx as any).letterSpacing = '0px';

  ctx.fillStyle = INK;
  const size = PW * 0.068;
  ctx.font = `700 ${size}px ${SERIF}`;
  const lines = wrap(ctx, p.title, M, bottom + M * 1.95, PW - M * 2, size * 1.3, 2);

  // sampleの旅から作ったPDFは、それと分かるようにタイトル直下に明示する
  if (p.sampleMark) {
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.026}px ${SANS}`;
    ctx.fillText('「sample」', M, bottom + M * 1.95 + (lines - 1) * size * 1.3 + M * 0.75);
  }

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
    /**
     * 3枚以上: 主1 + 従（均等グリッドにしない）。
     * 従は下の段に2〜3枚ずつ。6枚まで受ける（1ページの枚数を
     * 1〜6で選べるようにした）。主の高さは枚数が増えるほど譲る
     */
    const gap = M * 0.45;
    const subs = imgs.slice(1);
    // 従の段割り: 1段2〜3枚。[2] [3] [2,2] [2,3]
    const rows: number[] =
      subs.length <= 3 ? [subs.length] : subs.length === 4 ? [2, 2] : [2, 3];
    const hMain = areaH * (imgs.length <= 3 ? 0.58 : imgs.length === 4 ? 0.5 : 0.42);
    drawCover(ctx, imgs[0], M, top, PW - M * 2, hMain);
    const hSub = (areaH - hMain - gap * rows.length) / rows.length;
    let i = 0;
    let y = top + hMain + gap;
    for (const cols of rows) {
      const wSub = (PW - M * 2 - gap * (cols - 1)) / cols;
      for (let c = 0; c < cols && i < subs.length; c++, i++) {
        drawCover(ctx, subs[i], M + c * (wSub + gap), y, wSub, hSub);
      }
      y += hSub + gap;
    }
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
  // ラベルと数値は同じベースラインに置き、罫はそのすぐ下（18px）に引く。
  // 以前は罫を次の行の途中に引いていたため、文字と下線がずれて見えた
  let y = PH * 0.34;
  p.stats.forEach(([label, value]) => {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = FAINT;
    ctx.font = `400 ${PW * 0.022}px ${SANS}`;
    ctx.fillText(label, M, y);
    ctx.fillStyle = INK;
    ctx.font = `700 ${PW * 0.038}px ${SERIF}`;
    ctx.textAlign = 'right';
    ctx.fillText(value, PW - M, y);
    ctx.textAlign = 'left';
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, y + 18); ctx.lineTo(PW - M, y + 18); ctx.stroke();
    y += PW * 0.075;
  });
  ctx.fillStyle = FAINT;
  ctx.font = `700 ${PW * 0.034}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.5;
  ctx.fillText('My Japan', PW / 2, PH - M * 2.4);
  // 出版元。本の奥付なので、ここだけは会社名をきちんと書く
  ctx.font = `400 ${PW * 0.02}px ${SANS}`;
  ctx.globalAlpha = 0.45;
  ctx.fillText('Published by MATCHA, Inc. · matcha-jp.com', PW / 2, PH - M * 1.9);
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
): number {
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
  return lines.length || 1;
}

export const PAGE_SIZE = { width: PW, height: PH };
export type { PagePhoto };

/**
 * 注文に焼き付けてあるページ画像から、入稿用PDFを組む。
 *
 * 注文時点の中身をそのまま刷るために、旅を作り直さない。
 * （旅はあとから編集され得るので、作り直すと注文と違うものが刷られる）
 *
 * **解像度の注意**: 焼き付けてある画像は A5 / 200dpi 相当。
 * 写真は耐えるが、300dpi を求める印刷所には「200dpi入稿」であることを
 * 伝えること。上げるには、かごに入れる時点で刷り用の解像度で焼く必要がある。
 */
export async function printPdfFromPages(
  urls: string[],
  onProgress?: (p: RenderProgress) => void
): Promise<Blob | null> {
  if (typeof document === 'undefined' || urls.length === 0) return null;
  try {
    const trimW = PW * PRINT_SCALE;
    const trimH = PH * PRINT_SCALE;
    const bleed = BLEED * PRINT_SCALE;
    const sheetW = Math.round(trimW + bleed * 2);
    const sheetH = Math.round(trimH + bleed * 2);
    const doc = new jsPDF({ unit: 'px', format: [sheetW, sheetH], compress: true });

    for (let i = 0; i < urls.length; i++) {
      const dataUrl = await toDataUrl(urls[i]);
      if (!dataUrl) continue;
      if (i > 0) doc.addPage([sheetW, sheetH]);
      doc.setFillColor(PAPER);
      doc.rect(0, 0, sheetW, sheetH, 'F');
      doc.addImage(dataUrl, 'JPEG', bleed, bleed, trimW, trimH);
      drawCropMarks(doc, sheetW, sheetH, bleed);
      onProgress?.({ done: i + 1, total: urls.length });
    }
    return doc.output('blob');
  } catch {
    return null;
  }
}

/** Storage のURLを dataURL にする（jsPDF に渡すため） */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
