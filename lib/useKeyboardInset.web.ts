/**
 * モバイルブラウザのソフトキーボード分の余白。
 * アプリのシェルは 100dvh 固定でスクロールしないため、キーボードが出ても
 * ブラウザが勝手に押し上げてくれず、画面下の入力欄が隠れてしまう。
 * visualViewport の縮み幅をそのまま余白として返し、呼び出し側で
 * スクロール領域の下に足して逃がす。
 */
import { useEffect, useState } from 'react';

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv: any = (window as any).visualViewport;
    if (!vv) return;
    const update = () => {
      // レイアウトビューポートとの差分がキーボードの高さ
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      setInset(diff > 80 ? Math.round(diff) : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

/** 入力欄がキーボードに隠れたときに見える位置まで運ぶ。 */
export function scrollInputIntoView(delayMs = 320) {
  if (typeof document === 'undefined') return;
  setTimeout(() => {
    const el = document.activeElement as HTMLElement | null;
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, delayMs);
}
