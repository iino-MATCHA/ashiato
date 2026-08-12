/**
 * カード1枚分の「何をどこに描くか」を組み立てる。
 * ここは純粋な計算だけ。react-native-svg と canvas の両方がこの結果を描く。
 *
 * 構図は「日本地図に、行った場所の写真を丸く貼る」だけ。
 * 台紙に見立ててポラロイド・日付の付箋・便箋を載せた版も作ったが、
 * 紙が増えるほど肝心の地図が読めなくなったので落とした。
 * 色と文字の置き方はその版のまま残してある。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID } from '@/lib/prefectures';
import { VB_W, contentHeight, okinawaOffset, pathBox, project, spread } from './geo';
import { isJapanCoord } from '@/lib/coords';
import { C, PHOTO, TYPE, pinRadius } from './layout';

export interface ScenePin { x: number; y: number; r: number; uri: string }
export interface ScenePath { d: string; visited: boolean; okinawa: boolean }
/** 左上に重ねる大判写真。cx/cy は中心、rot は度。 */
export interface ScenePhoto {
  cx: number; cy: number; w: number; h: number;
  rot: number; radius: number; border: number; uri: string;
}

export interface Scene {
  w: number;
  h: number;
  /** 地図を版面に載せるための変換 */
  map: { scale: number; tx: number; ty: number };
  paths: ScenePath[];
  okinawa: { dx: number; dy: number };
  pins: ScenePin[];
  photos: ScenePhoto[];
  text: {
    eyebrow: { x: number; y: number; size: number };
    dates: { x: number; y: number; size: number };
    title: { x: number; y: number; size: number; maxW: number };
    stats: { x: number; y: number; size: number; labelSize: number };
  };
}

export interface SceneStop {
  lat: number;
  lng: number;
  image: string;
}

export interface SceneInput {
  width: number;
  stops: SceneStop[];
  visitedPrefectureCodes: number[];
}

export function buildScene({ width: w, stops: allStops, visitedPrefectureCodes }: SceneInput): Scene {
  // 座標の無いstop（lat/lngがnull→0に潰れたもの・日本の外）は貼らない。
  // project() は日本の外の座標も素直に外挿するので、(0,0) を渡すと
  // ピンが版面のはるか外（実地図ではアフリカ沖）へ飛ぶ
  const stops = allStops.filter((s) => isJapanCoord(s.lat, s.lng));
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
  // 重なりをほどいた結果が版面や文字の上へ逃げないよう、地図の箱に押し戻す
  const top = h * C.mapTop;
  const bottom = h * (C.mapTop + C.mapHeight);
  const placed = spread(raw, r * 2 * C.pinSpread);
  const pins: ScenePin[] = placed.map((p, i) => ({
    x: Math.min(w - m * 0.4 - r, Math.max(m * 0.4 + r, p.x)),
    y: Math.min(bottom - r, Math.max(top + r, p.y)),
    r,
    uri: stops[i].image,
  }));

  // --- 左上に重ねる大判写真: 写真を持つ最初の stop から順に（同じ写真は数えない）。
  // 座標の無い stop の写真も使ってよいので、ピンとは別に allStops から拾う
  const photoUris: string[] = [];
  for (const s of allStops) {
    if (s.image && !photoUris.includes(s.image)) photoUris.push(s.image);
    if (photoUris.length >= PHOTO.slots.length) break;
  }
  const photos: ScenePhoto[] = photoUris.map((uri, i) => ({
    cx: w * PHOTO.slots[i].cx,
    cy: h * PHOTO.slots[i].cy,
    w: w * PHOTO.w,
    h: w * PHOTO.h,
    rot: PHOTO.slots[i].rot,
    radius: w * PHOTO.radius,
    border: w * PHOTO.border,
    uri,
  }));

  return {
    w, h,
    map: { scale, tx, ty },
    paths,
    okinawa: okinawaOffset(),
    pins,
    photos,
    text: {
      eyebrow: { x: m, y: m * 0.95, size: w * TYPE.eyebrow },
      dates: { x: w - m, y: m * 0.95, size: w * TYPE.meta },
      title: { x: m, y: h * 0.118, size: w * TYPE.title, maxW: w - m * 2 },
      stats: { x: m, y: h * 0.172, size: w * TYPE.stat, labelSize: w * TYPE.stat * TYPE.statLabel },
    },
  };
}
