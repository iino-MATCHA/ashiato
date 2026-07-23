import { useEffect, useRef } from 'react';
import {
  loadMapboxGL,
  arcBetween,
  directionsProfile,
  fetchRoute,
} from '@/lib/mapbox';
import type { Step } from '@/lib/mock';

interface Props {
  steps: Step[];
  activeIndex: number;
  onSelect: (i: number) => void;
  height?: number;
  /** bottom offset (px) so the active pin sits above the cards row */
  bottomInset?: number;
}

/**
 * Japan map with photo pins, per-leg routes, and fly-to on the active step.
 * Web implementation (mapbox-gl from CDN).
 */
export function TripMap({
  steps,
  activeIndex,
  onSelect,
  height = 360,
  bottomInset = 150,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ el: HTMLDivElement; inner: HTMLDivElement; root: HTMLDivElement }[]>([]);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // init once
  useEffect(() => {
    let cancelled = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12', // realistic aerial (Polarsteps-like)
          center: [steps[0]?.lng ?? 138, steps[0]?.lat ?? 36],
          zoom: 5,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        // Photo pins. IMPORTANT: mapbox writes `transform: translate(...)` onto the
        // marker root every frame. We must NOT put a CSS transition on the root, or
        // the position gets eased and the pin visibly drifts. So the root only holds
        // position; a separate inner element does the scale + transition.
        steps.forEach((s, i) => {
          const root = document.createElement('div'); // mapbox controls this transform
          root.style.cssText = 'width:52px;height:52px;cursor:pointer;';

          const inner = document.createElement('div'); // our scale lives here
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

          new mapboxgl.Marker({ element: root, anchor: 'center' })
            .setLngLat([s.lng, s.lat])
            .addTo(map);
          markersRef.current.push({ el, inner, root });
        });

        map.on('load', async () => {
          await buildRoutes(map, steps);
          readyRef.current = true;
          // frame all points initially
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

  // fly to active step + highlight its pin
  useEffect(() => {
    if (readyRef.current) updateActive(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  function updateActive(i: number) {
    const map = mapRef.current;
    const step = steps[i];
    if (!map || !step) return;

    map.easeTo({
      center: [step.lng, step.lat],
      zoom: 11,
      duration: 1400,
      offset: [0, -bottomInset / 2], // keep pin above the cards
      essential: true,
    });

    markersRef.current.forEach((m, idx) => {
      const active = idx === i;
      // scale on the INNER element only — the root's translate (set by mapbox)
      // is untouched, so the anchor never drifts
      m.inner.style.transform = active ? 'scale(1.28)' : 'scale(1)';
      m.el.style.borderColor = active ? '#69AF00' : '#fff';
      m.root.style.zIndex = active ? '10' : '1';
    });
  }

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

/** Build one GeoJSON line per leg; road legs via Directions, air/rail as arcs. */
async function buildRoutes(map: any, steps: Step[]) {
  const features: any[] = [];
  for (let i = 1; i < steps.length; i++) {
    const from: [number, number] = [steps[i - 1].lng, steps[i - 1].lat];
    const to: [number, number] = [steps[i].lng, steps[i].lat];
    const profile = directionsProfile(steps[i].transport);
    let coords: [number, number][] | null = null;
    let road = false;
    if (profile) {
      coords = await fetchRoute(from, to, profile);
      road = !!coords;
    }
    if (!coords) coords = arcBetween(from, to);
    features.push({
      type: 'Feature',
      properties: { road, mode: steps[i].transport },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }

  const data = { type: 'FeatureCollection', features };
  if (map.getSource('route')) {
    map.getSource('route').setData(data);
    return;
  }
  map.addSource('route', { type: 'geojson', data });

  // road legs: solid line
  map.addLayer({
    id: 'route-road',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'road'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#69AF00', 'line-width': 3.5 },
  });
  // air/rail legs: dashed arc
  map.addLayer({
    id: 'route-arc',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'road'], false],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#69AF00', 'line-width': 2.5, 'line-dasharray': [1.5, 1.5] },
  });
}
