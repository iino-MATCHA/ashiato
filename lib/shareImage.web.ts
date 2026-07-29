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

const WEB_INTENT: Record<ShareTarget, (text: string) => string> = {
  x: (text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
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
  filename: string
): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return 'failed';

  const file = await toFile(dataUrl, filename);

  // ① 共有シートに画像ごと渡せるなら、それが一番きれいに入る
  if (file && (navigator as any).canShare?.({ files: [file] })) {
    try {
      await (navigator as any).share({ files: [file], text });
      return 'shared';
    } catch (e: any) {
      // ユーザーがシートを閉じただけなら、勝手に保存へ回さない
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }

  // ② 画像を保存して、投稿画面を開く
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    window.open(WEB_INTENT[target](text), '_blank', 'noopener');
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
