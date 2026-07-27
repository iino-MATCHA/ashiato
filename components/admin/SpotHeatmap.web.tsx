/**
 * ⑦ スポットマッピング（ヒートマップ）。
 * admin_municipality_stats が返す市区町村の座標＋訪問数を Mapbox の heatmap
 * レイヤーで描く。ズームを上げると個々のスポットが円で見える。
 */
import { useEffect, useRef } from 'react';
import { loadMapboxGL } from '@/lib/mapbox';

export interface SpotPoint {
  code: string | number;
  name: string;
  lat: number;
  lng: number;
  visits: number;
}

export function SpotHeatmap({ points, height = 420 }: { points: SpotPoint[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  // 地図の生成は一度だけ。データ更新は setData で流し込む。
  useEffect(() => {
    let cancelled = false;
    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [137.5, 37.5],
          zoom: 4.1,
          attributionControl: false,
        });
        mapRef.current = map;

        map.on('load', () => {
          map.addSource('spots', { type: 'geojson', data: emptyFc() });
          map.addLayer({
            id: 'spots-heat',
            type: 'heatmap',
            source: 'spots',
            maxzoom: 9,
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'visits'], 0, 0, 20, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 1, 9, 3],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(105,175,0,0)',
                0.2, 'rgba(156,196,85,0.5)',
                0.4, 'rgba(105,175,0,0.7)',
                0.7, 'rgba(217,130,102,0.85)',
                1, 'rgba(196,67,43,0.95)',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 14, 9, 40],
              'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.35],
            },
          });
          map.addLayer({
            id: 'spots-point',
            type: 'circle',
            source: 'spots',
            minzoom: 6.5,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['get', 'visits'], 1, 4, 30, 16],
              'circle-color': '#69AF00',
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 0, 8, 0.75],
              'circle-stroke-width': 1,
              'circle-stroke-color': 'rgba(255,255,255,0.9)',
            },
          });

          const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
          map.on('mousemove', 'spots-point', (e: any) => {
            const f = e.features?.[0];
            if (!f) return;
            map.getCanvas().style.cursor = 'pointer';
            popup.setLngLat(f.geometry.coordinates).setText(`${f.properties.name} · ${f.properties.visits}`).addTo(map);
          });
          map.on('mouseleave', 'spots-point', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
          });

          feed(map, pointsRef.current);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, []);

  const pointsRef = useRef(points);
  pointsRef.current = points;
  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded?.()) feed(map, points);
  }, [points]);

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }} />;
}

function emptyFc() {
  return { type: 'FeatureCollection', features: [] } as any;
}

function feed(map: any, points: SpotPoint[]) {
  const src = map.getSource('spots');
  if (!src) return;
  src.setData({
    type: 'FeatureCollection',
    features: points
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { name: p.name, visits: p.visits },
      })),
  });
}
