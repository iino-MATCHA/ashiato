/**
 * カード1枚分の「何をどこに描くか」を組み立てる。
 * ここは純粋な計算だけ。react-native-svg と canvas の両方がこの結果を描く。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID } from '@/lib/prefectures';
import { VB_W, contentHeight, okinawaOffset, project, spread } from './geo';
import { C, TYPE, pinRadius } from './layout';

export interface ScenePin { x: number; y: number; r: number; uri: string }
export interface ScenePath { d: string; visited: boolean; okinawa: boolean }

export interface Scene {
  w: number;
  h: number;
  /** 地図を版面に載せるための変換 */
  map: { scale: number; tx: number; ty: number };
  paths: ScenePath[];
  okinawa: { dx: number; dy: number };
  pins: ScenePin[];
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

  // --- 地図: 幅いっぱいに収め、指定の帯の中で天地中央に置く
  const mapBoxW = w - m * 2;
  const mapBoxH = h * C.mapHeight;
  const srcH = contentHeight();
  const scale = Math.min(mapBoxW / VB_W, mapBoxH / srcH);
  const tx = m + (mapBoxW - VB_W * scale) / 2;
  const ty = h * C.mapTop + (mapBoxH - srcH * scale) / 2;

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
    y: Math.min(h * 0.86 - r, Math.max(h * 0.11 + r, p.y)),
    r,
    uri: stops[i].image,
  }));

  return {
    w, h,
    map: { scale, tx, ty },
    paths,
    okinawa: okinawaOffset(),
    pins,
    text: {
      eyebrow: { x: m, y: m * 0.95, size: w * TYPE.eyebrow },
      dates: { x: w - m, y: m * 0.95, size: w * TYPE.meta },
      title: { x: m, y: h - m - w * 0.13, size: w * TYPE.title, maxW: w - m * 2 },
      stats: { x: m, y: h - m - w * 0.02, size: w * TYPE.stat, gap: w * 0.055 },
    },
  };
}
