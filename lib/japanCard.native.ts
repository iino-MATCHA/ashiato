/**
 * ネイティブは canvas が無いため未実装（将来 react-native-view-shot で対応）。
 * 呼び出し側は null を「保存できなかった」として扱う。
 */
export interface JapanCardMeta {
  percent: number;
  count: number;
  total: number;
  rank: string;
  visitedCodes: number[];
}

export async function exportJapanCard(_meta: JapanCardMeta): Promise<string | null> {
  return null;
}
