/**
 * GA4 (gtag) への送信。
 *
 * タグ本体は dist/index.html の <head> に入っている（inject-head.mjs）。
 * ここは「gtag があるときだけ送る」だけの薄い窓口。
 * ネイティブや gtag がブロックされている環境では黙って何もしない
 * （計測のためにアプリの動作を止めない）。
 */
export function track(event: string, params?: Record<string, unknown>): void {
  try {
    const w = window as any;
    if (typeof w?.gtag === 'function') w.gtag('event', event, params ?? {});
  } catch {
    // 計測は落ちても本体は動かす
  }
}

/** SPAなので、画面遷移のたびに自分で page_view を送る。 */
export function trackPageView(path: string): void {
  track('page_view', { page_path: path, page_location: typeof location === 'undefined' ? path : location.href });
}
