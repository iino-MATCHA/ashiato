/**
 * ネイティブ側の書き出しは未実装（@rnmapbox/maps 導入時に対応）。
 * 呼び出し側は null を「保存できなかった」として扱う。
 */
import type { Step } from './mock';

export interface ShareCardMeta {
  title: string;
  prefectures: number;
  days: number;
  km: number;
  authorName: string;
  authorHandle: string;
  avatarUrl?: string;
}

export async function exportShareCard(_steps: Step[], _meta: ShareCardMeta): Promise<string | null> {
  return null;
}
