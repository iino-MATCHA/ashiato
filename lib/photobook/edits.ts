/**
 * 製本の手直し（v1: 写真の取捨と表紙の選択）。
 *
 * **台割(plan.ts)は純粋関数のまま触らない。** 手直しは
 *   「旅のデータを編集内容で削ってから planBook に渡す」
 * という前処理で効かせる。こうすると自動の台割・配分・帯の仕組みが
 * そのまま生き、編集画面は JSON をひとつ書き換えるだけで済む。
 *
 * 保存先は localStorage（端末ごと）。
 * DBに books.plan (jsonb) を持つのが本来の形だが、v1では
 * 「かごに入れる時点で全ページを焼く」既存の原則があるため、
 * 焼く前の下書きを端末に置くだけで実用になる ―― 焼いたあとの本は
 * どの端末から見ても同じ（page_urls が正）。
 */
import type { Trip } from '@/lib/mock';
import type { BookPlan } from './plan';

export interface BookEdits {
  /** 表紙の主写真（未指定なら自動選定のまま） */
  cover?: string;
  /** 本に載せない写真のURI */
  excluded: string[];
  /** 1ページに置く写真の枚数（1〜6）。未指定なら自動（2〜3枚） */
  photosPerPage?: number;
}

const KEY = (tripId: string) => `mj-book-edits-${tripId}`;

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export function readBookEdits(tripId: string): BookEdits {
  const s = storage();
  if (!s) return { excluded: [] };
  try {
    const raw = s.getItem(KEY(tripId));
    if (!raw) return { excluded: [] };
    const v = JSON.parse(raw);
    return {
      cover: typeof v.cover === 'string' ? v.cover : undefined,
      excluded: Array.isArray(v.excluded) ? v.excluded.filter((x: unknown) => typeof x === 'string') : [],
      photosPerPage:
        typeof v.photosPerPage === 'number' && v.photosPerPage >= 1 && v.photosPerPage <= 6
          ? Math.round(v.photosPerPage)
          : undefined,
    };
  } catch {
    return { excluded: [] };
  }
}

export function writeBookEdits(tripId: string, edits: BookEdits): void {
  const s = storage();
  if (!s) return;
  try {
    if (!edits.cover && !edits.excluded.length && !edits.photosPerPage) s.removeItem(KEY(tripId));
    else s.setItem(KEY(tripId), JSON.stringify(edits));
  } catch {}
}

/** 外した写真を旅から削る（planBook に渡す前の前処理）。旅そのものは変えない */
export function applyBookEdits(trip: Trip, edits: BookEdits): Trip {
  if (!edits.excluded.length) return trip;
  const drop = new Set(edits.excluded);
  return {
    ...trip,
    steps: trip.steps.map((s) => ({ ...s, images: s.images.filter((u) => !drop.has(u)) })),
  };
}

/**
 * 表紙の主写真を選び直す（planBook の後処理）。
 * 自動選定の並びから選んだ1枚を先頭へ。外された写真は表紙にもしない。
 */
export function applyCover(plan: BookPlan, edits: BookEdits): BookPlan {
  const cover = edits.cover;
  if (!cover || edits.excluded.includes(cover)) return plan;
  const first = plan.pages[0];
  if (!first || first.kind !== 'cover') return plan;
  const rest = first.photos.filter((u) => u !== cover);
  return {
    ...plan,
    pages: [{ ...first, photos: [cover, ...rest].slice(0, 4) }, ...plan.pages.slice(1)],
  };
}
