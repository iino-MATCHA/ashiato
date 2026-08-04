/**
 * 生成した画像を、そのままSNSへ渡す（Web）。
 *
 * ブラウザから X や Instagram の投稿欄に画像を直接入れる方法は、
 * 実質 Web Share API のファイル共有しかない。intent の URL には
 * 画像を添付できず、文字とリンクしか運べない。
 *
 * なので:
 *   スマホ（共有シートが使える）… navigator.share でファイルごと渡す。
 *                                  シートで X / Instagram を選べば画像が入る
 *   PC（共有シートが無い）        … 画像を保存してから投稿画面を開く。
 *                                  あとは保存した画像を貼ってもらう
 *
 * 呼び出し側は結果を見て、PCのときだけ「保存したので貼ってください」と
 * 伝える。黙って文字だけ投稿させない。
 */
export type ShareTarget = 'x' | 'instagram';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/**
 * 投稿画面のURL。
 * X は url を別に渡すと、本文とは分けてリンクとして扱われ、
 * 貼り先でカード（OGP）が開く。text に混ぜると開かないことがある。
 */
const WEB_INTENT: Record<ShareTarget, (text: string, url?: string) => string> = {
  x: (text, url) =>
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
    (url ? '&url=' + encodeURIComponent(url) : ''),
  // Instagram に「投稿画面を開く」URLは公開されていないので、
  // ストーリーズを開くところまで案内する
  instagram: () => 'https://www.instagram.com/',
};

async function toFile(dataUrl: string, filename: string): Promise<File | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  } catch {
    return null;
  }
}

export async function shareImage(
  target: ShareTarget,
  dataUrl: string,
  text: string,
  filename: string,
  /** 投稿に添えるリンク。旅の共有ページなど。貼り先でカードが開く */
  url?: string
): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return 'failed';

  const file = await toFile(dataUrl, filename);

  // ① 共有シートに画像ごと渡せるなら、それが一番きれいに入る
  if (file && (navigator as any).canShare?.({ files: [file] })) {
    try {
      await (navigator as any).share({ files: [file], text, ...(url ? { url } : null) });
      return 'shared';
    } catch (e: any) {
      // ユーザーがシートを閉じただけなら、勝手に保存へ回さない
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }

  // ② 画像を保存して、投稿画面を開く
  try {
    await downloadBlob(dataUrl, filename);
    window.open(WEB_INTENT[target](text, url), '_blank', 'noopener');
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

/**
 * data:URL を blob:URL に変えてから <a download> を踏む。
 * iOS(WebKit) は data:URL の download 属性を無視するので、
 * data のまま click() しても何も起きない（「保存できない」の正体）。
 * blob ならデスクトップ・スマホとも保存が走る。
 */
async function downloadBlob(dataUrl: string, filename: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);   // DOMに載せないと無視するブラウザがある
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * 「保存」ボタンの本体。
 * スマホでは共有シートに画像だけを渡す（シートの「画像を保存」から
 * カメラロールに入る。iOSのブラウザには直接保存する道が無い）。
 * シートが無い・使えない環境では blob でのダウンロードに落ちる。
 */
export async function saveImage(dataUrl: string, filename: string): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return 'failed';

  const touch = (navigator as any).maxTouchPoints > 0;
  if (touch) {
    const file = await toFile(dataUrl, filename);
    if (file && (navigator as any).canShare?.({ files: [file] })) {
      try {
        await (navigator as any).share({ files: [file] });
        return 'shared';
      } catch (e: any) {
        if (e?.name === 'AbortError') return 'cancelled';
        // シートが開けなかったときはダウンロードへ落ちる
      }
    }
  }
  try {
    await downloadBlob(dataUrl, filename);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
