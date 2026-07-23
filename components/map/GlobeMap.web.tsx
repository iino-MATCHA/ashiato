import { useEffect, useRef } from 'react';
import { loadMapboxGL } from '@/lib/mapbox';
import { trips } from '@/lib/mock';

/**
 * Rotating 3D globe (Mapbox globe projection, auto-spin).
 * Web implementation using mapbox-gl loaded from CDN.
 */
export function GlobeMap({ height = 300 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let userInteracting = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          projection: 'globe',
          center: [138, 36], // over Japan
          zoom: 1.6,
          attributionControl: false,
          interactive: true,
        });
        mapRef.current = map;

        map.on('style.load', () => {
          map.setFog({
            color: 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': 0.02,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': 0.6,
          });

          // Mark each trip's first location with a small vermilion dot.
          trips.forEach((t) => {
            const s = t.steps[0];
            if (!s) return;
            const el = document.createElement('div');
            el.style.cssText =
              'width:12px;height:12px;border-radius:50%;background:#C4432B;box-shadow:0 0 0 3px rgba(196,67,43,0.35);border:1.5px solid #fff;';
            new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map);
          });
        });

        // Auto-spin (pauses while the user drags).
        const secondsPerRevolution = 140;
        const spinGlobe = () => {
          const zoom = map.getZoom();
          if (!userInteracting && zoom < 4) {
            const distancePerSecond = 360 / secondsPerRevolution;
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            map.easeTo({ center, duration: 1000, easing: (n: number) => n });
          }
        };
        map.on('mousedown', () => (userInteracting = true));
        map.on('dragstart', () => (userInteracting = true));
        map.on('mouseup', () => {
          userInteracting = false;
          spinGlobe();
        });
        map.on('dragend', () => {
          userInteracting = false;
          spinGlobe();
        });
        map.on('moveend', spinGlobe);
        spinGlobe();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, background: '#0b0b19' }}
    />
  );
}
