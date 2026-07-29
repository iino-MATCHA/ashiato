/**
 * 生成した画像を、そのままSNSへ渡す（ネイティブ）。
 *
 * カードは端末上で描いた data URL で来る。これを一度ファイルに落として
 * 共有シートへ渡す。data URL のまま Share.share に投げると、Android で
 * 取りこぼされて文字だけになることがある。
 *
 * X:
 *   まずアプリのURLスキームを試す。ただし twitter://post に画像は載せられない
 *   （仕様として文字しか受け取らない）ので、画像を渡すなら共有シートを通す。
 *   画像つきで投稿してもらうのが目的なので、共有シートを本線にする。
 *
 * Instagram:
 *   ストーリーズは instagram-stories://share で開けるが、画像は
 *   OS のペーストボードに専用の型で載せる必要があり、素の Expo では触れない。
 *   ここも共有シート経由（シートに Instagram が並ぶ）にする。
 *
 * どちらも「画像がそのまま相手のアプリに入る」という結果は同じで、
 * 一度だけ選ぶ手間が挟まる。
 */
import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ShareTarget = 'x' | 'instagram';
export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/** data URL をキャッシュに書き出して file:// のパスを返す。 */
async function writeTempFile(dataUrl: string, filename: string): Promise<string | null> {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return null;
  const base64 = dataUrl.slice(comma + 1);
  const dir = FileSystem.cacheDirectory;
  if (!dir) return null;
  const uri = `${dir}${filename}`;
  try {
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return uri;
  } catch {
    return null;
  }
}

export async function shareImage(
  _target: ShareTarget,
  dataUrl: string,
  text: string,
  filename: string
): Promise<ShareResult> {
  const uri = dataUrl ? await writeTempFile(dataUrl, filename) : null;

  // ① 画像つきで共有シートへ。ここから X / Instagram を選べば画像が入る
  if (uri && (await Sharing.isAvailableAsync())) {
    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: text,
      });
      return 'shared';
    } catch {
      // シートが開けなかった場合は下へ
    }
  }

  // ② 共有シートが使えない端末では OS 標準の共有に落とす。
  //    iOS は url でファイルを受け取れる。Android は文字だけになることがある
  try {
    const res = await Share.share(
      uri && Platform.OS === 'ios' ? { url: uri, message: text } : { message: text }
    );
    return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}
