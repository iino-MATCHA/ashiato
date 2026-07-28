/**
 * ネイティブは canvas が無いためPDF化は未実装。
 * 製本は Web の管理画面／ブラウザから行う想定。
 */
import type { BookPlan } from './plan';

export interface RenderProgress { done: number; total: number }

export async function renderPage(_plan: BookPlan, _index: number): Promise<string | null> {
  return null;
}

export async function renderPdf(
  _plan: BookPlan,
  _onProgress?: (p: RenderProgress) => void
): Promise<Blob | null> {
  return null;
}

export const PAGE_SIZE = { width: 1165, height: 1654 };
