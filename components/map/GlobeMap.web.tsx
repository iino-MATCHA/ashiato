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
    const cleanups: Array<() => void> = [];

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
              'width:12px;height:12px;border-radius:50%;background:#69AF00;box-shadow:0 0 0 3px rgba(105,175,0,0.35);border:1.5px solid #fff;';
            new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map);
          });
        });

        /**
         * 自動回転。
         *
         * ここは端末が熱くなっていた場所。moveend で次の easeTo を呼ぶ作りなので、
         * 一度動き出すとGPUが一秒も休まない。画面を見ていない間も回り続ける。
         *
         * 回すのは「この地球儀が実際に画面に映っていて、タブも前面にあって、
         * ユーザーが動きを嫌っていないとき」だけにする。条件が外れたら
         * 次の easeTo を出さない ＝ Mapbox は再描画をやめて静止する。
         *
         * 止まったときに困らないよう、止まった状態＝ただの静止した地球儀。
         * 中身が消えるわけではないので、判定が外れても壊れない。
         */
        const secondsPerRevolution = 140;
        const reduceMotion =
          typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        let onScreen = true;
        const maySpin = () =>
          !cancelled && !reduceMotion && onScreen && !userInteracting && document.visibilityState === 'visible';

        const spinGlobe = () => {
          if (!maySpin() || map.getZoom() >= 4) return;
          const distancePerSecond = 360 / secondsPerRevolution;
          const center = map.getCenter();
          center.lng -= distancePerSecond;
          map.easeTo({ center, duration: 1000, easing: (n: number) => n });
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

        // タブが後ろに回ったら止め、戻ってきたら再開する
        const onVisibility = () => spinGlobe();
        document.addEventListener('visibilitychange', onVisibility);
        cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

        // 地球儀が画面から出たら止める。IntersectionObserver が無い環境では
        // 従来どおり回り続けるだけで、表示は壊れない
        if (typeof IntersectionObserver === 'function' && containerRef.current) {
          const io = new IntersectionObserver(
            ([e]) => {
              onScreen = e.isIntersecting;
              if (onScreen) spinGlobe();
            },
            { threshold: 0.01 }
          );
          io.observe(containerRef.current);
          cleanups.push(() => io.disconnect());
        }

        spinGlobe();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
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
