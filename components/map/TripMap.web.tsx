import { useEffect, useRef } from 'react';
import {
  loadMapboxGL,
  arcBetween,
  directionsProfile,
  fetchRoute,
} from '@/lib/mapbox';
import type { Step, TransportMode } from '@/lib/mock';

interface Props {
  steps: Step[];
  activeIndex: number;
  onSelect: (i: number) => void;
  height?: number;
  /** bottom offset (px) so the active pin sits above the cards */
  bottomInset?: number;
  /** transport mode per stop (index-aligned to steps). Changing it redraws routes. */
  modes?: TransportMode[];
  /** when true, frame the whole route (overview) instead of the active stop */
  overview?: boolean;
}

/**
 * Japan map (pure satellite, no road lines) with photo pins, per-leg routes,
 * and fly-to on the active step. Web implementation (mapbox-gl from CDN).
 */
export function TripMap({
  steps,
  activeIndex,
  onSelect,
  height = 360,
  bottomInset = 150,
  modes,
  overview = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ el: HTMLDivElement; inner: HTMLDivElement; root: HTMLDivElement }[]>([]);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const effectiveModes = modes ?? steps.map((s) => s.transport);
  const modesKey = effectiveModes.join('|');

  // init once (per steps identity)
  useEffect(() => {
    let cancelled = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-v9', // pure aerial imagery, no drawn roads
          center: [steps[0]?.lng ?? 138, steps[0]?.lat ?? 36],
          zoom: 5,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        // Photo pins. mapbox writes transform onto the marker root each frame, so the
        // root carries NO transition; a separate inner element does the scale.
        steps.forEach((s, i) => {
          const root = document.createElement('div');
          root.style.cssText = 'width:52px;height:52px;cursor:pointer;';
          const inner = document.createElement('div');
          inner.style.cssText =
            'position:absolute;inset:0;transform-origin:center center;transition:transform .18s ease;will-change:transform;';
          const el = document.createElement('div');
          el.style.cssText = [
            'position:absolute;inset:0;border-radius:50%;',
            `background-image:url(${s.images[0]});background-size:cover;background-position:center;`,
            'border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);',
            'transition:border-color .18s ease;',
          ].join('');
          const badge = document.createElement('div');
          badge.textContent = String(i + 1);
          badge.style.cssText = [
            'position:absolute;top:-4px;right:-4px;',
            'font-size:10px;font-weight:700;color:#fff;background:#1B1815;',
            'border-radius:9px;min-width:16px;height:16px;line-height:16px;text-align:center;',
            'border:1.5px solid #fff;padding:0 2px;',
          ].join('');
          inner.appendChild(el);
          inner.appendChild(badge);
          root.appendChild(inner);
          root.addEventListener('click', () => onSelectRef.current(i));
          new mapboxgl.Marker({ element: root, anchor: 'center' }).setLngLat([s.lng, s.lat]).addTo(map);
          markersRef.current.push({ el, inner, root });
        });

        map.on('load', async () => {
          await buildRoutes(map, steps, effectiveModes);
          readyRef.current = true;
          if (steps.length > 1) {
            const b = new mapboxgl.LngLatBounds();
            steps.forEach((s) => b.extend([s.lng, s.lat]));
            map.fitBounds(b, { padding: 70, duration: 0 });
          }
          updateActive(activeIndex);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  // rebuild routes when a transport mode changes
  useEffect(() => {
    if (readyRef.current && mapRef.current) {
      buildRoutes(mapRef.current, steps, effectiveModes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modesKey]);

  // fly to active step (or frame the whole route in overview)
  useEffect(() => {
    if (!readyRef.current) return;
    if (overview) frameAll();
    else updateActive(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, overview]);

  function frameAll() {
    const map = mapRef.current;
    if (!map || steps.length === 0) return;
    let w = 180, e = -180, s = 90, n = -90;
    steps.forEach((st) => {
      w = Math.min(w, st.lng); e = Math.max(e, st.lng);
      s = Math.min(s, st.lat); n = Math.max(n, st.lat);
    });
    map.fitBounds([[w, s], [e, n]], { padding: { top: 90, bottom: bottomInset, left: 60, right: 60 }, duration: 1800, essential: true });
    markersRef.current.forEach((m) => {
      m.inner.style.transform = 'scale(1)';
      m.el.style.borderColor = '#fff';
      m.root.style.zIndex = '1';
    });
  }

  function updateActive(i: number) {
    const map = mapRef.current;
    const step = steps[i];
    if (!map || !step) return;
    // slower + more overhead so the movement reads clearly and stays legible
    map.flyTo({
      center: [step.lng, step.lat],
      zoom: 8.4,
      duration: 2400,
      curve: 1.4,
      offset: [0, -bottomInset / 2],
      essential: true,
    });
    markersRef.current.forEach((m, idx) => {
      const active = idx === i;
      m.inner.style.transform = active ? 'scale(1.28)' : 'scale(1)';
      m.el.style.borderColor = active ? '#69AF00' : '#fff';
      m.root.style.zIndex = active ? '10' : '1';
    });
  }

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

/** Build one GeoJSON line per leg; land legs via Directions, air/ferry as arcs. */
async function buildRoutes(map: any, steps: Step[], modes: TransportMode[]) {
  const features: any[] = [];
  for (let i = 1; i < steps.length; i++) {
    const from: [number, number] = [steps[i - 1].lng, steps[i - 1].lat];
    const to: [number, number] = [steps[i].lng, steps[i].lat];
    const mode = modes[i] ?? steps[i].transport;
    const profile = directionsProfile(mode);
    let coords: [number, number][] | null = null;
    let road = false;
    if (profile) {
      coords = await fetchRoute(from, to, profile);
      road = !!coords;
    }
    if (!coords) coords = arcBetween(from, to);
    features.push({
      type: 'Feature',
      properties: { road, mode },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }

  const data = { type: 'FeatureCollection', features };
  if (map.getSource('route')) {
    map.getSource('route').setData(data);
    return;
  }
  map.addSource('route', { type: 'geojson', data });
  map.addLayer({
    id: 'route-road',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'road'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#69AF00', 'line-width': 4 },
  });
  map.addLayer({
    id: 'route-arc',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'road'], false],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#69AF00', 'line-width': 3, 'line-dasharray': [1.5, 1.5] },
  });
}
