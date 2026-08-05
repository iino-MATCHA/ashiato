/**
 * Meta Pixel。
 *
 * 測定IDは **環境変数で渡す**（`EXPO_PUBLIC_META_PIXEL_ID`）。
 * 入っていなければ何も読み込まず、呼び出しは全部空振りになる ―― 広告を
 * 出していない環境で余計なリクエストを飛ばさないため。
 *
 * GA4 は dist/index.html の <head> に直接入っているが（scripts/inject-head.mjs）、
 * Pixel はIDが環境で変わるのでこちらから読み込む。
 * ローカルでも `.env` にIDを入れれば同じように動く。
 *
 * ネイティブでは何もしない。
 */
import { Platform } from 'react-native';

const PIXEL_ID = process.env.EXPO_PUBLIC_META_PIXEL_ID ?? '';

export const isPixelConfigured = !!PIXEL_ID && Platform.OS === 'web';

let started = false;

/**
 * Pixel本体を読み込む。何度呼んでも1回だけ動く。
 * 初期化のときに PageView が1件飛ぶ（Meta の作法）。
 */
export function initPixel(): void {
  if (!isPixelConfigured || started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  try {
    const w = window as any;
    if (w.fbq) return;
    const n: any = (w.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    w.fbq('init', PIXEL_ID);
    w.fbq('track', 'PageView');
  } catch {
    // 計測は落ちても本体は動かす
  }
}

/** Meta の標準イベント（Lead / ViewContent / CompleteRegistration など） */
export function pixelTrack(event: string, params?: Record<string, unknown>): void {
  if (!isPixelConfigured) return;
  try {
    (window as any)?.fbq?.('track', event, params ?? {});
  } catch {}
}

/** 標準に無いイベント */
export function pixelTrackCustom(event: string, params?: Record<string, unknown>): void {
  if (!isPixelConfigured) return;
  try {
    (window as any)?.fbq?.('trackCustom', event, params ?? {});
  } catch {}
}
