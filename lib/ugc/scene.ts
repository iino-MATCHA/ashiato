/**
 * カード1枚分の「何をどこに描くか」を組み立てる。
 * ここは純粋な計算だけ。react-native-svg と canvas の両方がこの結果を描く。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID } from '@/lib/prefectures';
import { VB_W, contentHeight, okinawaOffset, pathBox, project, spread } from './geo';
import { C, TYPE, pinRadius } from './layout';

export interface ScenePin { x: number; y: number; r: number; uri: string }
/** 額縁に入れて地図の上に置く写真 */
export interface SceneFrame {
  x: number; y: number; w: number; h: number;
  /** 傾き（度）。少しずらして、留めた写真のように見せる */
  rotate: number;
  uri: string;
}
export interface ScenePath { d: string; visited: boolean; okinawa: boolean }

export interface Scene {
  w: number;
  h: number;
  /** 地図を版面に載せるための変換 */
  map: { scale: number; tx: number; ty: number };
  paths: ScenePath[];
  okinawa: { dx: number; dy: number };
  pins: ScenePin[];
  frames: SceneFrame[];
  text: {
    eyebrow: { x: number; y: number; size: number };
    dates: { x: number; y: number; size: number };
    title: { x: number; y: number; size: number; maxW: number };
    stats: { x: number; y: number; size: number; gap: number };
  };
}

export interface SceneInput {
  width: number;
  stops: { lat: number; lng: number; image: string }[];
  visitedPrefectureCodes: number[];
}

export function buildScene({ width: w, stops, visitedPrefectureCodes }: SceneInput): Scene {
  const h = w * (16 / 9);
  const m = w * C.margin;

  /**
   * 地図の載せ方。
   *
   * 版面（860×830）ではなく、**日本そのものの外接矩形**に合わせる。
   * 版面には四隅に大きな余白があり、そこに合わせると日本が小さく写る。
   * 沖縄は千葉の下へ寄せて描くので、その分を足した箱で測る。
   *
   * 左右の逃げも文字と同じ余白では広すぎたので、地図だけ狭くする。
   * 日本は斜めに伸びた形なので、端まで使っても窮屈にならない。
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
  // 外接矩形の左上を原点へ引き戻したうえで、帯の中央に置く
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
    // 版面からはみ出さないように寄せる
    x: Math.min(w - m * 0.4 - r, Math.max(m * 0.4 + r, p.x)),
    y: Math.min(h * 0.94 - r, Math.max(h * 0.24 + r, p.y)),
    r,
    uri: stops[i].image,
  }));

  /**
   * 代表写真を1枚だけ、地図の左上に置く。
   *
   * 日本は右上から左下へ斜めに伸びるので、左上は必ず空いている。
   * そこに横長で1枚だけ置く。地点それぞれの写真は丸いアイコンが持つので、
   * ここで何枚も並べると同じ写真が二度出て散らかる。
   */
  const withPhoto = stops.filter((st) => !!st.image);
  const fw = w * C.frameW;
  const fh = fw * C.frameRatio;
  const frames: SceneFrame[] = withPhoto.length
    ? [{ x: w * 0.10, y: h * 0.235, w: fw, h: fh, rotate: -9, uri: withPhoto[0].image }]
    : [];

  return {
    w, h,
    map: { scale, tx, ty },
    paths,
    okinawa: okinawaOffset(),
    pins,
    frames,
    /**
     * 文字はすべて上に集める。
     * 以前は題名と数字を左下に置いていたが、インスタのストーリーは
     * 下端に返信欄が重なるため、そこがまるごと隠れていた。
     * 上から「ブランド → 題名 → 数字 → 地図」の順で読ませる。
     */
    text: {
      eyebrow: { x: m, y: m * 0.95, size: w * TYPE.eyebrow },
      dates: { x: w - m, y: m * 0.95, size: w * TYPE.meta },
      title: { x: m, y: h * 0.108, size: w * TYPE.title, maxW: w - m * 2 },
      stats: { x: m, y: h * 0.155, size: w * TYPE.stat, gap: w * 0.055 },
    },
  };
}
