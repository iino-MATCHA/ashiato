/**
 * ネイティブは canvas が無いため未実装。
 * 画面のカードは captureCard（react-native-view-shot）で写し取るので、
 * ここが null を返しても共有はできる。
 */
export interface StopCardMeta {
  image: string;
  title: string;
  place: string;
  prefecture: string;
  dateLabel: string;
}

export async function exportStopCard(_meta: StopCardMeta): Promise<string | null> {
  return null;
}
