/**
 * 緯度経度 → 日本地図SVG(viewBox 860x830) の座標。
 *
 * 変換式は、47都道府県の SVG パスの外接矩形中心と、municipalities_master から
 * 求めた各県の実重心を最小二乗で突き合わせて決めた（沖縄は本来の位置に
 * 描かれていないので除外）。残差の中央値は 7.7 / 860 ≒ 0.9%。
 *
 * 沖縄だけは別扱い。元のSVGでは房総沖に浮いて見えるので、
 * 千葉の真下にインセットとして置き直す。
 */
import { PREFECTURE_PATHS } from '@/lib/mappath';

export const VB_W = 860;
export const VB_H = 830;

const LNG_A = 43.587447;
const LNG_B = -5619.9403;
const LAT_A = -51.627489;
const LAT_B = 2378.9873;

export interface Box { minX: number; minY: number; maxX: number; maxY: number }

const NUM = /-?\d+(?:\.\d+)?/g;

/** パス文字列の座標をすべて拾って外接矩形を出す（コマンドは L/M のみなので数値の並びで足りる）。 */
export function pathBox(d: string): Box {
  const v = (d.match(NUM) ?? []).map(Number);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    minX = Math.min(minX, v[i]); maxX = Math.max(maxX, v[i]);
    minY = Math.min(minY, v[i + 1]); maxY = Math.max(maxY, v[i + 1]);
  }
  return { minX, minY, maxX, maxY };
}

let cache: { okinawa: Box; chiba: Box } | null = null;
function boxes() {
  if (!cache) {
    cache = { okinawa: pathBox(PREFECTURE_PATHS.okinawa), chiba: pathBox(PREFECTURE_PATHS.chiba) };
  }
  return cache;
}

/** 沖縄インセットを千葉の下へ動かす平行移動量。 */
export function okinawaOffset(): { dx: number; dy: number } {
  const { okinawa, chiba } = boxes();
  const chibaCx = (chiba.minX + chiba.maxX) / 2;
  const okiCx = (okinawa.minX + okinawa.maxX) / 2;
  return {
    dx: chibaCx - okiCx,
    // 千葉と地続きに見えない距離を空ける（28では近すぎた）。
    // この隙間には JapanSvgMap が区切りの点線を引く
    dy: chiba.maxY + 52 - okinawa.minY,
  };
}

/** 沖縄の実際の座標範囲（municipalities_master の最小最大）。 */
const OKI = { minLat: 24.322048, maxLat: 27.036224, minLng: 122.987678, maxLng: 131.302378 };

/** 沖縄県内の地点か（先島諸島まで含む）。 */
function isOkinawa(lat: number, lng: number): boolean {
  return lat < 28 && lng < 132.2;
}

/** 緯度経度をSVG座標へ。沖縄はインセット内に収める。 */
export function project(lat: number, lng: number): { x: number; y: number } {
  if (isOkinawa(lat, lng)) {
    const { okinawa } = boxes();
    const { dx, dy } = okinawaOffset();
    const tx = (lng - OKI.minLng) / (OKI.maxLng - OKI.minLng);
    const ty = (OKI.maxLat - lat) / (OKI.maxLat - OKI.minLat);
    return {
      x: okinawa.minX + tx * (okinawa.maxX - okinawa.minX) + dx,
      y: okinawa.minY + ty * (okinawa.maxY - okinawa.minY) + dy,
    };
  }
  return { x: LNG_A * lng + LNG_B, y: LAT_A * lat + LAT_B };
}

/** 描画に必要な全体の高さ（沖縄を下げた分だけ伸びる）。 */
export function contentHeight(): number {
  const { okinawa } = boxes();
  const { dy } = okinawaOffset();
  return Math.max(VB_H, okinawa.maxY + dy + 10);
}

/** 近すぎるピンを少しだけ離す（同じ市に複数stopがある場合に重なるため）。 */
export function spread(points: { x: number; y: number }[], minDist: number): { x: number; y: number }[] {
  const out = points.map((p) => ({ ...p }));
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d < minDist) {
          const push = (minDist - d) / 2;
          const ux = dx / d, uy = dy / d;
          out[i].x -= ux * push; out[i].y -= uy * push;
          out[j].x += ux * push; out[j].y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return out;
}
