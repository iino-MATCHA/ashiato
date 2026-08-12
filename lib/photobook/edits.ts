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

/** 1つの写真ページに載せる写真（並び順のまま印刷される） */
export interface BookPageOverride {
  photos: string[];
}

export interface BookEdits {
  /** 表紙の主写真（未指定なら自動選定のまま） */
  cover?: string;
  /** 本に載せない写真のURI */
  excluded: string[];
  /** 1ページに置く写真の枚数（1〜6）。未指定なら自動（2〜3枚） */
  photosPerPage?: number;
  /**
   * ページごとの割付（v2）。
   * 部分指定ではなく、**写真ページ全体をこの並びで置き換える**。
   * 最初にどこか1ページを触った時点で、そのときの台割を丸ごと写して
   * ここに固定する（触っていないページも「いまの形」で保存される）。
   * 未指定なら従来どおり photosPerPage で自動割付。
   */
  pageOverrides?: BookPageOverride[];
  /**
   * 本のためだけに追加した写真のURL（旅のstopには足さない）。
   * 表紙とページ割付の候補にだけ現れ、割付に置かない限り本には載らない。
   */
  extraPhotos?: string[];
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
    // v1（cover / excluded / photosPerPage のみ）の保存もそのまま読める。
    // 新しい項目は「無ければ undefined」でよい
    const strings = (a: unknown): string[] =>
      Array.isArray(a) ? a.filter((x: unknown): x is string => typeof x === 'string') : [];
    const overrides: BookPageOverride[] | undefined = Array.isArray(v.pageOverrides)
      ? v.pageOverrides
          .map((p: unknown) => ({ photos: strings((p as any)?.photos).slice(0, 6) }))
          .filter((p: BookPageOverride) => p.photos.length > 0)
      : undefined;
    return {
      cover: typeof v.cover === 'string' ? v.cover : undefined,
      excluded: strings(v.excluded),
      photosPerPage:
        typeof v.photosPerPage === 'number' && v.photosPerPage >= 1 && v.photosPerPage <= 6
          ? Math.round(v.photosPerPage)
          : undefined,
      pageOverrides: overrides?.length ? overrides : undefined,
      extraPhotos: strings(v.extraPhotos).length ? strings(v.extraPhotos) : undefined,
    };
  } catch {
    return { excluded: [] };
  }
}

export function writeBookEdits(tripId: string, edits: BookEdits): void {
  const s = storage();
  if (!s) return;
  try {
    const empty =
      !edits.cover && !edits.excluded.length && !edits.photosPerPage &&
      !edits.pageOverrides?.length && !edits.extraPhotos?.length;
    if (empty) s.removeItem(KEY(tripId));
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
 * ページごとの割付を planBook に渡せる形にする。
 * 外した写真は割付からも落とし、空になったページは詰める。
 * 割付が無い（= v1 の編集のまま）なら undefined を返して自動割付に任せる。
 */
export function pageAssignmentsFrom(edits: BookEdits): BookPageOverride[] | undefined {
  if (!edits.pageOverrides?.length) return undefined;
  const drop = new Set(edits.excluded);
  const pages = edits.pageOverrides
    .map((p) => ({ photos: p.photos.filter((u) => !drop.has(u)).slice(0, 6) }))
    .filter((p) => p.photos.length > 0);
  return pages.length ? pages : undefined;
}

/**
 * 表紙の主写真を選び直す（planBook の後処理）。
 * 旅の全写真＋追加写真のどれでも選べる（自動選定の4枚に限らない）。
 * 選んだ1枚を先頭へ。外された写真は表紙にもしない。
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
