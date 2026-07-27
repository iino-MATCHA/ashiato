import { useEffect, useRef } from 'react';
import { loadMapboxGL } from '@/lib/mapbox';
import type { Step } from '@/lib/mock';

/**
 * シェアカード用の地図。
 * 衛星写真をそのまま貼るとぼやけて見えるので、
 *  - 球面投影 + 大気(fog) で奥行きを出す
 *  - 衛星ラスターのコントラスト／彩度を少し上げる
 *  - 旅のルートを白いグローつきの線で描き、地点は白リングのドットで置く
 * ことで「写真」ではなく「作品」として見えるようにしている。
 */
export function ShareMap({
  steps,
  height,
  onReady,
}: {
  steps: Step[];
  height: number;
  /** 書き出し側が地図の状態を使えるようにする */
  onReady?: (map: any) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapboxGL()
      .then(async (mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        const map = await buildShareMap(mapboxgl, containerRef.current, steps);
        if (cancelled) { map.remove(); return; }
        mapRef.current = map;
        onReady?.(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  return <div ref={containerRef} style={{ width: '100%', height, background: '#0b1a2b' }} />;
}

/** カード内の余白（上のタイトル帯・下のスタッツ帯に地図の主役を隠されないための比率） */
const PAD = { top: 0.14, bottom: 0.22, side: 0.1 };

/**
 * 衛星写真をできるだけ精細に出すためのスタイル。
 * 既定の satellite-v9 は 512px タイルなので、同じ表示倍率でも1段階粗い。
 * tileSize:256 にすると mapbox が1段深いズームのタイルを取りにいくので、
 * 実質2倍の解像度になり、カードにしたときのざらつきが消える。
 */
const SHARP_SATELLITE: any = {
  version: 8,
  sources: {
    sat: { type: 'raster', url: 'mapbox://mapbox.satellite', tileSize: 256 },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0b1a2b' } },
    {
      id: 'satellite',
      type: 'raster',
      source: 'sat',
      paint: { 'raster-saturation': 0.18, 'raster-contrast': 0.12, 'raster-resampling': 'linear' },
    },
  ],
};

/**
 * 共有カード用の地図を作って、タイル描画が落ち着くまで待つ。
 * プレビューと書き出しの両方から使う。
 */
export async function buildShareMap(mapboxgl: any, container: HTMLElement, steps: Step[]): Promise<any> {
  const w = container.clientWidth || 360;
  const h = container.clientHeight || 640;

  const map = new mapboxgl.Map({
    container,
    style: SHARP_SATELLITE,
    projection: 'globe',
    center: [137.5, 37.5],
    zoom: 3.6,
    interactive: false,
    attributionControl: false,
    preserveDrawingBuffer: true, // canvas.toDataURL() で書き出すため
    fadeDuration: 0,
    maxTileCacheSize: 512,
  });

  await once(map, 'style.load');

  // 大気。宇宙の色を濃くしすぎると縁が汚く見えるので薄めに。
  try {
    map.setFog({
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.03,
      'space-color': 'rgb(9, 14, 28)',
      'star-intensity': 0.35,
    });
  } catch {}
  frame(map, steps, w, h);

  // 訪れた場所は、線でつながずに小さな光の点だけで置く。
  // ルートを描くと衛星写真の上で線が主役になってしまい、絵として重くなるため。
  steps.forEach((s) => {
    const el = document.createElement('div');
    el.style.cssText = [
      'width:9px;height:9px;border-radius:50%;',
      'background:#F2FFE0;',
      'box-shadow:0 0 0 2px rgba(255,255,255,0.55), 0 0 10px 3px rgba(143,209,63,0.85);',
    ].join('');
    new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([s.lng, s.lat]).addTo(map);
  });

  // タイルが出揃うまで待つ（書き出しが真っ黒になるのを防ぐ）
  await Promise.race([once(map, 'idle'), delay(6000)]);
  return map;
}

function frame(map: any, steps: Step[], w: number, h: number) {
  if (!steps.length) return;
  let west = 180, east = -180, south = 90, north = -90;
  steps.forEach((s) => {
    west = Math.min(west, s.lng); east = Math.max(east, s.lng);
    south = Math.min(south, s.lat); north = Math.max(north, s.lat);
  });
  const padding = {
    top: Math.round(h * PAD.top),
    bottom: Math.round(h * PAD.bottom),
    left: Math.round(w * PAD.side),
    right: Math.round(w * PAD.side),
  };
  if (steps.length === 1 || (east - west < 0.5 && north - south < 0.5)) {
    map.jumpTo({ center: [(west + east) / 2, (north + south) / 2], zoom: 6.4 });
    return;
  }
  map.fitBounds([[west, south], [east, north]], { padding, duration: 0, maxZoom: 7.5 });
}

function once(map: any, event: string): Promise<void> {
  return new Promise((resolve) => map.once(event, () => resolve()));
}
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
