import { useEffect, useRef } from 'react';
import { loadMapboxGL } from '@/lib/mapbox';
import type { Step } from '@/lib/mock';

/**
 * Non-interactive satellite map of Japan with this trip's pins, for the share card.
 */
export function ShareMap({ steps, height }: { steps: Step[]; height: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-v9',
          center: [137.5, 38],
          zoom: 3.4,
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true, // allow canvas.toDataURL() for download
        });
        mapRef.current = map;
        map.on('load', () => {
          steps.forEach((s) => {
            const el = document.createElement('div');
            el.style.cssText =
              'width:14px;height:14px;border-radius:50%;background:#69AF00;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5);';
            new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([s.lng, s.lat]).addTo(map);
          });
          if (steps.length > 1) {
            let w = 180, e = -180, so = 90, n = -90;
            steps.forEach((st) => { w = Math.min(w, st.lng); e = Math.max(e, st.lng); so = Math.min(so, st.lat); n = Math.max(n, st.lat); });
            // tighter framing so Japan fills more of the card
            map.fitBounds([[w, so], [e, n]], { padding: 28, duration: 0, maxZoom: 7 });
          } else if (steps[0]) {
            map.jumpTo({ center: [steps[0].lng, steps[0].lat], zoom: 6 });
          }
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [steps]);

  return <div ref={containerRef} style={{ width: '100%', height, background: '#0b1a2b' }} />;
}
