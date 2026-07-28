/**
 * ネイティブは canvas が無いため未実装（将来 react-native-view-shot で対応）。
 * 呼び出し側は null を「保存できなかった」として扱う。
 */
export interface ShareCardMeta {
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: { lat: number; lng: number; image: string }[];
  visitedPrefectureCodes: number[];
}

export async function exportShareCard(_meta: ShareCardMeta): Promise<string | null> {
  return null;
}
