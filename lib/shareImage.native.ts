/**
 * 生成した画像を、そのままSNSへ渡す（ネイティブ）。
 * OSの共有シートに画像を渡し、そこから X / Instagram を選んでもらう。
 *
 * 画像はカードを描いたときの data URL で来る。iOS はこれをそのまま
 * 受け取れるが、Android は取りこぼすことがある。実機で確かめるまでは
 * 文言も一緒に渡して、最低限テキストは残るようにしておく。
 */
import { Share } from 'react-native';

export type ShareTarget = 'x' | 'instagram';
export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function shareImage(
  _target: ShareTarget,
  dataUrl: string,
  text: string,
  _filename: string
): Promise<ShareResult> {
  try {
    const res = await Share.share(dataUrl ? { url: dataUrl, message: text } : { message: text });
    return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}
