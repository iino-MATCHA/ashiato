/**
 * 台割（どのページに何を載せるか）を組む。純粋関数。
 *
 * ページ数は写真の枚数から決まる:
 *   固定4ページ（表紙・行程図・道中記・奥付）+ 写真ページ（1ページに2〜3枚）
 * 章扉は独立ページにせず、各県の最初の写真ページに帯として載せる。
 * 空押しのような「息継ぎ」ページは廃止（ページ数を膨らませない）。
 */
import type { Trip, Step } from '@/lib/mock';
import {
  PREFECTURE_EN_BY_ID, PREFECTURE_KANJI_BY_ID, PREFECTURE_KANA_BY_ID,
  PREFECTURE_ID_BY_SLUG, slugForName,
} from '@/lib/prefectures';

/** これ未満だと本として薄すぎる。書き出し前に足すよう促す */
export const MIN_PHOTOS = 5;

// ---------------------------------------------------------------- 型

export interface Chapter {
  prefCode: number;
  prefEn: string;
  prefKanji: string;
  prefKana: string;
  stops: Step[];
  /** 同じ県に離れて再訪した場合の回数（2回目以降は帯に出す） */
  visitNo: number;
  days: number;
  photoCount: number;
  /** この章が使う写真ページ数（配分結果） */
  pages: number;
}

export interface ChapterLabel {
  prefEn: string;
  prefKanji: string;
  prefKana: string;
  visitNo: number;
  dateLabel: string;
  sekki: string;
}

export interface PagePhoto { uri: string; stopTitle: string }

export type Page =
  | {
      kind: 'cover';
      title: string;
      dateLabel: string;
      /** 主写真＋帯写真（旅全体から散らして選ぶ、最大4枚） */
      photos: string[];
      /** サンプルの旅から作ったPDFであることの明示 */
      sampleMark: boolean;
      progress: number;
    }
  | { kind: 'map'; title: string; stops: { lat: number; lng: number }[]; visitedCodes: number[]; progress: number }
  | { kind: 'itinerary'; rows: ItineraryRow[]; progress: number }
  | {
      kind: 'photos';
      photos: PagePhoto[];
      caption: string;
      place: string;
      /** 章の最初のページにだけ付く帯 */
      chapter?: ChapterLabel;
      progress: number;
    }
  | { kind: 'colophon'; stats: [string, string][]; progress: number };

export interface ItineraryRow {
  date: string;
  placeEn: string;
  prefEn: string;
  transport: string;
}

export interface BookPlan {
  pages: Page[];
  chapters: Chapter[];
  totalPhotos: number;
  /** 進行帯のために、地点が全体のどこかを 0..1 で持つ */
  stopProgress: number[];
}

// ---------------------------------------------------------------- 二十四節気

const SEKKI: [number, number, string, string][] = [
  [2, 4, '立春', 'early February'], [2, 19, '雨水', 'late February'],
  [3, 5, '啓蟄', 'early March'], [3, 20, '春分', 'the spring equinox'],
  [4, 5, '清明', 'early April'], [4, 20, '穀雨', 'late April'],
  [5, 5, '立夏', 'early May'], [5, 21, '小満', 'late May'],
  [6, 6, '芒種', 'early June'], [6, 21, '夏至', 'the summer solstice'],
  [7, 7, '小暑', 'early July'], [7, 23, '大暑', 'late July'],
  [8, 7, '立秋', 'early August'], [8, 23, '処暑', 'late August'],
  [9, 8, '白露', 'early September'], [9, 23, '秋分', 'the autumn equinox'],
  [10, 8, '寒露', 'early October'], [10, 23, '霜降', 'late October'],
  [11, 7, '立冬', 'early November'], [11, 22, '小雪', 'late November'],
  [12, 7, '大雪', 'early December'], [12, 22, '冬至', 'the winter solstice'],
  [1, 6, '小寒', 'early January'], [1, 20, '大寒', 'late January'],
];

/** 日付に対応する節気。年による1日程度のずれは無視する。 */
export function sekkiFor(date: string): string {
  if (!date) return '';
  const [, mm, dd] = date.split('-').map(Number);
  if (!mm || !dd) return '';
  const sorted = [...SEKKI].sort((a, b) => a[0] * 100 + a[1] - (b[0] * 100 + b[1]));
  let hit = sorted[sorted.length - 1];
  for (const s of sorted) {
    if (s[0] * 100 + s[1] <= mm * 100 + dd) hit = s;
  }
  return `${hit[2]} · ${hit[3]}`;
}

// ---------------------------------------------------------------- 章立て

function prefCodeOf(step: Step): number {
  return PREFECTURE_ID_BY_SLUG[slugForName(step.prefectureName ?? '')] ?? 0;
}

/** 連続する同じ県をひとつの章にまとめる（日付や地点では切らない）。 */
export function buildChapters(steps: Step[]): Chapter[] {
  const out: Chapter[] = [];
  const seen = new Map<number, number>();
  steps.forEach((s) => {
    const code = prefCodeOf(s);
    const last = out[out.length - 1];
    if (last && last.prefCode === code) {
      last.stops.push(s);
      return;
    }
    const visitNo = (seen.get(code) ?? 0) + 1;
    seen.set(code, visitNo);
    out.push({
      prefCode: code,
      prefEn: PREFECTURE_EN_BY_ID[code] ?? s.prefectureName ?? '',
      prefKanji: PREFECTURE_KANJI_BY_ID[code] ?? '',
      prefKana: PREFECTURE_KANA_BY_ID[code] ?? '',
      stops: [s],
      visitNo,
      days: 0,
      photoCount: 0,
      pages: 0,
    });
  });
  out.forEach((ch) => {
    ch.photoCount = ch.stops.reduce((n, s) => n + s.images.filter(Boolean).length, 0);
    ch.days = new Set(ch.stops.map((s) => s.loggedAt)).size;
  });
  return out;
}

/**
 * n枚の写真をページに分ける。
 * 既定は「1ページ2〜3枚」の自動。`per` を渡すと、その枚数（1〜6）で割る
 * ―― 置く位置までは決められなくても、密度は選べるようにする（要望）。
 * どちらの場合も、端数が1のときは [.., k, 1] にせず [.., k-1, 2] に直す
 * （1枚だけのページを作らない。1枚を選んだときは別）。
 */
export function groupPhotos(n: number, per?: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1]; // 1枚しか無いときだけ許す
  const size = per && per >= 1 && per <= 6 ? Math.round(per) : 3;
  const groups: number[] = [];
  let left = n;
  while (left > 0) {
    groups.push(Math.min(size, left));
    left -= size;
  }
  if (size > 1 && groups.length > 1 && groups[groups.length - 1] === 1) {
    groups[groups.length - 2] -= 1;
    groups[groups.length - 1] = 2;
  }
  return groups;
}

/** 台割の注文。写真の密度だけ（並べる位置は自動のまま） */
export interface PlanOptions {
  /** 1ページに置く写真の枚数（1〜6）。未指定なら自動（2〜3枚） */
  photosPerPage?: number;
}

// ---------------------------------------------------------------- 台割

export function planBook(trip: Trip, opts: PlanOptions = {}): BookPlan {
  const steps = trip.steps ?? [];
  const chapters = buildChapters(steps);
  const totalPhotos = chapters.reduce((n, c) => n + c.photoCount, 0);

  const totalStops = Math.max(steps.length - 1, 1);
  const stopProgress = steps.map((_, i) => i / totalStops);
  const progressOfStop = (s: Step) => {
    const i = steps.indexOf(s);
    return i < 0 ? 0 : stopProgress[i];
  };

  const pages: Page[] = [];
  const visitedCodes = chapters.map((c) => c.prefCode).filter(Boolean);

  // 表紙: 旅の全体から等間隔に写真を抜いてコラージュに（主1枚＋帯3枚）
  const coverPhotos: string[] = [];
  const allFirstImages = steps.map((s) => s.images[0]).filter(Boolean);
  const want = Math.min(4, allFirstImages.length);
  for (let i = 0; i < want; i++) {
    const idx = want === 1 ? 0 : Math.round((i * (allFirstImages.length - 1)) / (want - 1));
    const uri = allFirstImages[idx];
    if (uri && !coverPhotos.includes(uri)) coverPhotos.push(uri);
  }
  pages.push({
    kind: 'cover',
    title: trip.title,
    dateLabel: dateLabel(trip.startDate, trip.endDate),
    photos: coverPhotos,
    sampleMark: !!trip.sample,
    progress: 0,
  });
  pages.push({
    kind: 'map',
    title: trip.title,
    stops: steps.map((s) => ({ lat: s.lat, lng: s.lng })),
    visitedCodes,
    progress: 0,
  });
  pages.push({
    kind: 'itinerary',
    rows: steps.map((s) => ({
      date: s.loggedAt,
      placeEn: s.placeName || s.title,
      prefEn: s.prefectureName ?? '',
      transport: s.transport,
    })),
    progress: 0,
  });

  // 写真ページ: 章ごとに全写真を2〜3枚ずつ割る。章の最初のページに帯を付ける
  chapters.forEach((ch) => {
    const photos: PagePhoto[] = [];
    ch.stops.forEach((s) => {
      s.images.filter(Boolean).forEach((uri) => photos.push({ uri, stopTitle: s.title }));
    });
    if (!photos.length) return;

    const first = ch.stops[0];
    const label: ChapterLabel = {
      prefEn: ch.prefEn,
      prefKanji: ch.prefKanji,
      prefKana: ch.prefKana,
      visitNo: ch.visitNo,
      dateLabel: dateLabel(first?.loggedAt, ch.stops[ch.stops.length - 1]?.loggedAt),
      sekki: sekkiFor(first?.loggedAt ?? ''),
    };

    let cursor = 0;
    const groups = groupPhotos(photos.length, opts.photosPerPage);
    ch.pages = groups.length;
    groups.forEach((take, gi) => {
      const slice = photos.slice(cursor, cursor + take);
      cursor += take;
      // このページの写真がどのstopのものかで説明文を選ぶ
      const stop = ch.stops.find((s) => s.title === slice[0]?.stopTitle) ?? ch.stops[0];
      pages.push({
        kind: 'photos',
        photos: slice,
        caption: stop?.note ?? '',
        place: stop?.placeName || stop?.title || '',
        chapter: gi === 0 ? label : undefined,
        progress: progressOfStop(stop),
      });
    });
  });

  pages.push({
    kind: 'colophon',
    stats: [
      ['Prefectures', `${new Set(visitedCodes).size} / 47`],
      ['Stops', String(steps.length)],
      ['Distance', `${trip.distanceKm.toLocaleString()} km`],
      ['Days', String(daysBetween(trip.startDate, trip.endDate))],
      ['Photos', String(totalPhotos)],
    ],
    progress: 1,
  });

  return { pages, chapters, totalPhotos, stopProgress };
}

// ---------------------------------------------------------------- 小物

export function daysBetween(a?: string, b?: string): number {
  if (!a) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b || a).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export function dateLabel(a?: string, b?: string): string {
  if (!a) return '';
  const f = (d: string) => d.replace(/-/g, '.');
  if (!b || b === a) return f(a);
  return `${f(a)} – ${f(b).slice(5)}`;
}
