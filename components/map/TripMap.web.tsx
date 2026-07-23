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
  const markersRef = useRef<{ el: HTMLDivElement; wrap: HTMLDivElement }[]>([]);
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
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [steps[0]?.lng ?? 138, steps[0]?.lat ?? 36],
          zoom: 5,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        // photo pins
        steps.forEach((s, i) => {
          const wrap = document.createElement('div');
          wrap.style.cssText =
            'display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform .2s ease;';

          const el = document.createElement('div');
          el.style.cssText = [
            'width:44px;height:44px;border-radius:50%;',
            `background-image:url(${s.images[0]});background-size:cover;background-position:center;`,
            'border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);',
            'transition:all .2s ease;',
          ].join('');

          const badge = document.createElement('div');
          badge.textContent = String(i + 1);
          badge.style.cssText =
            'margin-top:2px;font-size:10px;font-weight:700;color:#fff;background:#1B1815;border-radius:8px;padding:0 5px;line-height:15px;';

          wrap.appendChild(el);
          wrap.appendChild(badge);
          wrap.addEventListener('click', () => onSelectRef.current(i));

          new mapboxgl.Marker({ element: wrap, anchor: 'bottom' })
            .setLngLat([s.lng, s.lat])
            .addTo(map);
          markersRef.current.push({ el, wrap });
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
      m.el.style.width = active ? '64px' : '44px';
      m.el.style.height = active ? '64px' : '44px';
      m.el.style.borderColor = active ? '#C4432B' : '#fff';
      m.wrap.style.zIndex = active ? '10' : '1';
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
    paint: { 'line-color': '#C4432B', 'line-width': 3.5 },
  });
  // air/rail legs: dashed arc
  map.addLayer({
    id: 'route-arc',
    type: 'line',
    source: 'route',
    filter: ['==', ['get', 'road'], false],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#C4432B', 'line-width': 2.5, 'line-dasharray': [1.5, 1.5] },
  });
}
