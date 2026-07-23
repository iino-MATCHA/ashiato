/**
 * Mapbox の設定と、Web用の mapbox-gl 動的ローダー。
 * -------------------------------------------------------------
 * トークンは環境変数 EXPO_PUBLIC_MAPBOX_TOKEN から読む。
 * - ローカル: .env に設定（.env は git 管理外）
 * - Vercel:  Project Settings → Environment Variables に設定
 * 公開トークン(pk.)でも GitHub のシークレット検出に引っかかるため、
 * ソースには直書きしない。Mapbox 管理画面で URL 制限も推奨。
 */
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
export const isMapboxConfigured = Boolean(MAPBOX_TOKEN);

const MAPBOX_VERSION = 'v3.9.1';

let loaderPromise: Promise<any> | null = null;

/**
 * mapbox-gl の JS/CSS を CDN から読み込み、window.mapboxgl を解決する。
 * Metro でのバンドルを避け、Web で安定して動かすための方式。
 */
export function loadMapboxGL(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (!MAPBOX_TOKEN) return Promise.reject(new Error('EXPO_PUBLIC_MAPBOX_TOKEN is not set'));
  const w = window as any;
  if (w.mapboxgl) return Promise.resolve(w.mapboxgl);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement('script');
    script.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () => {
      const mb = (window as any).mapboxgl;
      if (mb) {
        mb.accessToken = MAPBOX_TOKEN;
        resolve(mb);
      } else {
        reject(new Error('mapbox-gl failed to load'));
      }
    };
    script.onerror = () => reject(new Error('mapbox-gl script error'));
    document.body.appendChild(script);
  });
  return loaderPromise;
}

/**
 * 2地点間の弧（大圏を模した簡易ベジエ）を返す。飛行機・新幹線など
 * 道路ルートに乗らない移動手段の軌跡描画に使う。
 */
export function arcBetween(
  from: [number, number],
  to: [number, number],
  segments = 64
): [number, number][] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  // 中点を法線方向に持ち上げてカーブを作る
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const lift = dist * 0.18; // カーブの高さ
  // 法線方向（-dy, dx）を正規化
  const nx = dist === 0 ? 0 : -dy / dist;
  const ny = dist === 0 ? 0 : dx / dist;
  const cx = mx + nx * lift;
  const cy = my + ny * lift;

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push([a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2]);
  }
  return pts;
}

/**
 * Directions API のプロファイルを返す。陸上移動（車/電車/新幹線/バス）は
 * driving で道路ネットワーク上のルートを描く。徒歩は walking。
 * 飛行機・フェリーは道路に乗らないため null（弧で描画）。
 */
export function directionsProfile(
  mode: string
): 'driving' | 'walking' | 'cycling' | null {
  switch (mode) {
    case 'walk':
      return 'walking';
    case 'bike':
      return 'cycling';
    case 'car':
    case 'train':
    case 'shinkansen':
    case 'bus':
      return 'driving';
    // 飛行機・フェリーは弧で描く
    case 'plane':
    case 'ferry':
    default:
      return null;
  }
}

/** Mapbox Directions API で道路ルートの座標列を取得。 */
export async function fetchRoute(
  from: [number, number],
  to: [number, number],
  profile: 'driving' | 'walking' | 'cycling'
): Promise<[number, number][] | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(coords) ? coords : null;
  } catch {
    return null;
  }
}
