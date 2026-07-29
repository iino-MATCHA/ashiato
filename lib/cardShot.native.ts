/**
 * 画面に出ているカードをそのまま画像にする（ネイティブ）。
 *
 * Web はカードを Canvas で 1080px に描き直しているが、ネイティブに Canvas は
 * 無い。代わりに、プレビューとして既に描かれている本物のビューを写し取る。
 * 見えているものがそのまま出るので、プレビューと結果がずれない。
 *
 * 画面上のカードは 340px 程度しかないので、書き出しは Web と同じ 1080×1920 に
 * 引き伸ばす。端末の解像度に関係なく、SNSで粗く見えない大きさにする。
 */
import { captureRef } from 'react-native-view-shot';

const OUT = { width: 1080, height: 1920 };

export async function captureCard(ref: any): Promise<string | null> {
  if (!ref?.current) return null;
  try {
    return await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'data-uri',
      ...OUT,
    });
  } catch {
    return null;
  }
}
