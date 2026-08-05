/**
 * カード1枚分の「何をどこに描くか」を組み立てる。
 * ここは純粋な計算だけ。react-native-svg と canvas の両方がこの結果を描く。
 *
 * 構図は「旅の切り抜きを貼った台紙」。
 * 地図を据え、そこへ写真・日付の付箋・添え書きを貼り付ける。
 * 付箋は地図上の地点と破線でつなぐので、どの紙がどこの話か分かる。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID } from '@/lib/prefectures';
import { VB_W, contentHeight, okinawaOffset, pathBox, project, spread } from './geo';
import { C, TYPE, pinRadius } from './layout';

export interface ScenePin { x: number; y: number; r: number; uri: string }
export interface ScenePath { d: string; visited: boolean; okinawa: boolean }

/** 台紙に貼ったポラロイド。1枚だけ大きく見せる */
export interface SceneFrame {
  x: number; y: number; w: number; h: number;
  /** 傾き（度）。少しずらして、留めた写真のように見せる */
  rotate: number;
  uri: string;
  /** 下の余白に手書きで添える地名 */
  caption: string;
}

/** 日付と地名を書いた付箋。地図上の地点と破線でつながる */
export interface SceneTag {
  x: number; y: number; w: number; h: number;
  rotate: number;
  /** 「Day 8–14」 */
  day: string;
  /** 「Aomori」 */
  place: string;
  /** つなぎ先（地図上の地点） */
  toX: number; toY: number;
  /** 破線の始点（付箋の縁） */
  fromX: number; fromY: number;
}

export interface Scene {
  w: number;
  h: number;
  /** 地図を版面に載せるための変換 */
  map: { scale: number; tx: number; ty: number };
  paths: ScenePath[];
  okinawa: { dx: number; dy: number };
  pins: ScenePin[];
  frames: SceneFrame[];
  tags: SceneTag[];
  text: {
    eyebrow: { x: number; y: number; size: number };
    dates: { x: number; y: number; size: number };
    title: { x: number; y: number; size: number; maxW: number };
    subtitle: { x: number; y: number; size: number };
    stats: { x: number; y: number; size: number; gap: number };
    /** 下の便箋 */
    note: { x: number; y: number; w: number; h: number; size: number; lines: string[] };
  };
}

export interface SceneStop {
  lat: number;
  lng: number;
  image: string;
  /** 「Day 8–14」。呼び出し側が旅の開始日から作る */
  day?: string;
  /** 付箋に出す地名 */
  place?: string;
}

export interface SceneInput {
  width: number;
  stops: SceneStop[];
  visitedPrefectureCodes: number[];
  /** ポラロイドの下に手書きで添える地名 */
  coverCaption?: string;
}

export function buildScene({
  width: w,
  stops,
  visitedPrefectureCodes,
  coverCaption = '',
}: SceneInput): Scene {
  const h = w * (16 / 9);
  const m = w * C.margin;

  /**
   * 地図の載せ方。
   *
   * 版面（860×830）ではなく、**日本そのものの外接矩形**に合わせる。
   * 版面には四隅に大きな余白があり、そこに合わせると日本が小さく写る。
   * 沖縄は千葉の下へ寄せて描くので、その分を足した箱で測る。
   */
  const oki = okinawaOffset();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    const b = pathBox(d);
    const dx = slug === 'okinawa' ? oki.dx : 0;
    const dy = slug === 'okinawa' ? oki.dy : 0;
    minX = Math.min(minX, b.minX + dx); maxX = Math.max(maxX, b.maxX + dx);
    minY = Math.min(minY, b.minY + dy); maxY = Math.max(maxY, b.maxY + dy);
  });
  if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = VB_W; maxY = contentHeight(); }
  const srcW = maxX - minX;
  const srcH = maxY - minY;

  const mapInset = w * C.mapInset;
  const mapBoxW = w - mapInset * 2;
  const mapBoxH = h * C.mapHeight;
  const scale = Math.min(mapBoxW / srcW, mapBoxH / srcH);
  const tx = mapInset + (mapBoxW - srcW * scale) / 2 - minX * scale;
  const ty = h * C.mapTop + (mapBoxH - srcH * scale) / 2 - minY * scale;

  const visited = new Set(visitedPrefectureCodes);
  const paths: ScenePath[] = [];
  Object.entries(PREFECTURE_PATHS).forEach(([slug, d]) => {
    const code = PREFECTURE_SLUG_BY_ID.findIndex((s) => s === slug);
    paths.push({ d, visited: visited.has(code), okinawa: slug === 'okinawa' });
  });

  // --- ピン: 投影 → 版面へ変換 → 重なりをほどく
  const r = pinRadius(w, stops.length);
  const raw = stops.map((s) => {
    const p = project(s.lat, s.lng);
    return { x: tx + p.x * scale, y: ty + p.y * scale };
  });
  const placed = spread(raw, r * 2 * C.pinSpread);
  const pins: ScenePin[] = placed.map((p, i) => ({
    x: Math.min(w - m * 0.4 - r, Math.max(m * 0.4 + r, p.x)),
    y: Math.min(h * 0.80 - r, Math.max(h * 0.28 + r, p.y)),
    r,
    uri: stops[i].image,
  }));

  /**
   * ポラロイド。旅の1枚目を台紙の左上に貼る。
   * 日本は右上から左下へ斜めに伸びるので、左上は必ず空いている。
   */
  const withPhoto = stops.filter((st) => !!st.image);
  const fw = w * C.frameW;
  const fh = fw * C.frameRatio;
  const frames: SceneFrame[] = withPhoto.length
    ? [{
        x: w * 0.075,
        y: h * 0.245,
        w: fw,
        h: fh,
        rotate: -6,
        uri: withPhoto[0].image,
        caption: coverCaption,
      }]
    : [];

  /**
   * 日付の付箋。
   *
   * 地点が版面の右寄りなら左へ、左寄りなら右へ逃がす。
   * 縦は地点の高さに沿わせるが、付箋どうしが重ならないよう間隔を空ける。
   */
  const tagW = w * 0.215;
  const tagH = w * 0.100;
  const labelled = stops
    .map((st, i) => ({ st, i }))
    .filter(({ st }) => !!st.day && !!st.place)
    .slice(0, 5);

  const usedY: number[] = [];
  const tags: SceneTag[] = labelled.map(({ st, i }, n) => {
    const pin = pins[i] ?? { x: w / 2, y: h / 2, r };
    const toLeft = pin.x > w * 0.48;
    const x = toLeft ? w * 0.018 : w - w * 0.018 - tagW;

    // 地点の高さに寄せつつ、既に置いた付箋と縦に被らないところまで下げる
    let y = Math.min(h * 0.755, Math.max(h * 0.255, pin.y - tagH / 2));
    const sameSide = usedY.filter((uy) => Math.abs(uy - y) < tagH * 1.15);
    if (sameSide.length) y = Math.max(...sameSide) + tagH * 1.2;
    y = Math.min(y, h * 0.775);
    usedY.push(y);

    return {
      x, y, w: tagW, h: tagH,
      rotate: n % 2 === 0 ? -2.5 : 2,
      day: st.day as string,
      place: st.place as string,
      toX: pin.x,
      toY: pin.y,
      fromX: toLeft ? x + tagW : x,
      fromY: y + tagH / 2,
    };
  });

  return {
    w, h,
    map: { scale, tx, ty },
    paths,
    okinawa: okinawaOffset(),
    pins,
    frames,
    tags,
    text: {
      eyebrow: { x: m, y: m * 0.95, size: w * TYPE.eyebrow },
      dates: { x: w - m, y: m * 0.95, size: w * TYPE.meta },
      title: { x: m, y: h * 0.105, size: w * TYPE.title, maxW: w - m * 2 },
      subtitle: { x: m, y: h * 0.138, size: w * 0.046 },
      stats: { x: m, y: h * 0.177, size: w * TYPE.stat, gap: w * 0.055 },
      note: {
        x: w * 0.07,
        y: h * 0.818,
        w: w * 0.60,
        h: h * 0.150,
        size: w * 0.043,
        lines: ['Collect moments.', 'Relive the journey.', 'Make them unforgettable.'],
      },
    },
  };
}
