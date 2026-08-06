/**
 * 日本地図をつまんで動かせるようにする窓。
 *
 * ライブラリは足さない。窓で切り抜いて、中身に translate+scale をかけるだけ。
 * （MATCHA eSIM の地図と同じ作り方に合わせてある）
 *
 * 動かしたあとの「離した瞬間のクリック」で県が選ばれてしまうと操作にならないので、
 * 一定以上動いていたら次のクリックだけ握りつぶす。
 *
 * **setPointerCapture は使わない。** capture すると pointerup 後の click が
 * この枠自身に付け替えられ、県の <path>（react-native-svg が onPress→onClick に
 * 変換している）まで届かなくなる ―― PCでマウスクリックしても県が選べなかった
 * 原因がこれ。代わりに move/up は window で追い、枠の外で離しても取り残さない。
 *
 * ---------------------------------------------------------------------------
 * 見た目は**使う側のCSSが持つ**。この中で使っているクラス名は
 *   .quizMap（外枠）/ .grabbing / .pan / .eased / .zoomBtns
 * で、LP(components/Landing.web.tsx)と診断LP(components/quiz/*)がそれぞれ
 * 自分の親クラスの下に同じ名前で書いている。ここにスタイルを持たせると
 * 2枚のLPで別々に育てられなくなるので、持たせていない。
 */
import React, { useEffect, useRef, useState } from 'react';

export function ZoomPan({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const MIN = 1;
  const MAX = 4;
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const [eased, setEased] = useState(true);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const pinch = useRef<{ dist: number; k: number } | null>(null);
  const moved = useRef(false);

  /** 拡大していない方向へは動かさない。端まで行ったらそこで止める */
  const clamp = (v: { x: number; y: number; k: number }) => {
    const k = Math.min(MAX, Math.max(MIN, v.k));
    const mx = ((k - 1) * width) / 2;
    const my = ((k - 1) * height) / 2;
    return { k, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
  };

  /**
   * 窓の中心を軸に倍率を変える（ボタン・ホイール用）。
   * 倍率は必ず「ひとつ前の値」から作る。closure の view を見て計算すると、
   * 続けて押したときに古い倍率から何度も同じ計算をしてしまう。
   */
  const zoomBy = (factor: number) => {
    setEased(true);
    setView((v) => {
      const k = Math.min(MAX, Math.max(MIN, v.k * factor));
      return clamp({ x: (v.x * k) / v.k, y: (v.y * k) / v.k, k });
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    setEased(false);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
      start.current = null;
    } else {
      start.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      setGrabbing(true);
    }
  };

  /** move / up は window で追う。枠の外へ出てもドラッグが続き、離せば必ず終わる */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const k = (pinch.current.k * d) / (pinch.current.dist || 1);
        moved.current = true;
        setView((v) => clamp({ ...v, k }));
        return;
      }
      const st = start.current;
      if (!st) return;
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      if (Math.hypot(dx, dy) > 6) moved.current = true;
      setView((v) => clamp({ ...v, x: st.vx + dx, y: st.vy + dy }));
    };
    const onEnd = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        start.current = null;
        setGrabbing(false);
        setEased(true);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
    // clamp が width/height を見るので、寸法が変わったら貼り直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setEased(false);
    setView((v) => clamp({ ...v, k: v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12) }));
  };

  return (
    <div
      className={`quizMap${grabbing ? ' grabbing' : ''}`}
      style={{ width, height }}
      onPointerDown={onPointerDown}
      onWheel={onWheel}
      // 動かした直後のクリックは県の選択に回さない
      onClickCapture={(e) => {
        if (moved.current) {
          e.stopPropagation();
          e.preventDefault();
          moved.current = false;
        }
      }}
    >
      <div
        className={`pan${eased ? ' eased' : ''}`}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {children}
      </div>

      <div className="zoomBtns">
        <button type="button" aria-label="zoom in" disabled={view.k >= MAX} onClick={() => zoomBy(1.5)}>+</button>
        <button type="button" aria-label="zoom out" disabled={view.k <= MIN} onClick={() => zoomBy(1 / 1.5)}>−</button>
      </div>
    </div>
  );
}
