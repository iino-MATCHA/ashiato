/**
 * 台割（どのページに何を載せるか）を組む。
 * docs/photobook.md の設計をそのまま実装した純粋関数。副作用も描画も持たない。
 */
import type { Trip, Step } from '@/lib/mock';
import { PREFECTURE_EN_BY_ID, PREFECTURE_KANJI_BY_ID, PREFECTURE_KANA_BY_ID, PREFECTURE_ID_BY_SLUG, slugForName } from '@/lib/prefectures';

// ---------------------------------------------------------------- 型

export interface Chapter {
  prefCode: number;
  prefEn: string;
  prefKanji: string;
  prefKana: string;
  stops: Step[];
  /** 同じ県に離れて再訪した場合の回数（2回目以降は扉に出す） */
  visitNo: number;
  days: number;
  photoCount: number;
  pages: number;
}

export type Page =
  | { kind: 'cover'; title: string; dateLabel: string; hero: string; progress: number }
  | { kind: 'map'; title: string; stops: { lat: number; lng: number }[]; visitedCodes: number[]; progress: number }
  | { kind: 'itinerary'; rows: ItineraryRow[]; progress: number }
  | {
      kind: 'chapter';
      prefEn: string; prefKanji: string; prefKana: string;
      visitNo: number; dateLabel: string; sekki: string;
      places: string[]; progress: number;
    }
  | { kind: 'photos'; photos: PagePhoto[]; caption: string; place: string; progress: number }
  | { kind: 'breather'; photo: PagePhoto; progress: number }
  | { kind: 'colophon'; stats: [string, string][]; progress: number };

export interface PagePhoto { uri: string; stopTitle: string }

export interface ItineraryRow {
  date: string;
  placeEn: string;
  prefEn: string;
  transport: string;
}

export interface BookPlan {
  pages: Page[];
  chapters: Chapter[];
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
  // その日以前で最も近い節気
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
    ch.photoCount = ch.stops.reduce((n, s) => n + s.images.length, 0);
    ch.days = new Set(ch.stops.map((s) => s.loggedAt)).size;
  });
  return out;
}

/**
 * ページ配分。写真枚数の平方根で重みをつける。
 * 線形にすると1箇所で100枚撮った旅で本が食い潰されるため。
 */
export function allocatePages(chapters: Chapter[], photoPages: number): Chapter[] {
  const weight = (c: Chapter) => Math.sqrt(Math.max(c.photoCount, 1)) * (1 + 0.15 * Math.max(c.days - 1, 0));
  const total = chapters.reduce((s, c) => s + weight(c), 0) || 1;
  chapters.forEach((c) => {
    const raw = Math.round((photoPages * weight(c)) / total);
    c.pages = Math.min(8, Math.max(1, raw));
  });
  return chapters;
}

/**
 * 章の写真を選ぶ。
 * 連写した似た写真が並ぶのを避けるため、各地点から等間隔に抜く
 * （1枚目はユーザーが自分で選んだ表紙なので必ず入れる）。
 */
export function pickPhotos(chapter: Chapter, slots: number): PagePhoto[] {
  const perStop = Math.max(1, Math.ceil(slots / chapter.stops.length));
  const picked: PagePhoto[] = [];
  chapter.stops.forEach((s) => {
    const imgs = s.images.filter(Boolean);
    if (!imgs.length) return;
    const take = Math.min(perStop, imgs.length);
    for (let i = 0; i < take; i++) {
      // 0, 中央, 末尾… と散らして取る
      const idx = take === 1 ? 0 : Math.round((i * (imgs.length - 1)) / (take - 1));
      const uri = imgs[idx];
      if (!picked.some((p) => p.uri === uri)) picked.push({ uri, stopTitle: s.title });
    }
  });
  return picked.slice(0, slots);
}

// ---------------------------------------------------------------- 台割

/** 1ページに載せる枚数。多すぎると「並べただけ」になるので最大4枚。 */
function photosPerPage(n: number): number[] {
  const out: number[] = [];
  let left = n;
  while (left > 0) {
    // 4枚のときは 2+2（3+1 だと1枚だけのページが締まらない）
    const take = Math.min(left, left === 4 ? 2 : 3);
    out.push(take);
    left -= take;
  }
  return out;
}

export interface PlanOptions {
  /** 目標ページ数。折に合わせて4の倍数に丸める */
  targetPages?: number;
}

export function planBook(trip: Trip, opts: PlanOptions = {}): BookPlan {
  const steps = trip.steps ?? [];
  const chapters = buildChapters(steps);

  // 固定ページ: 表紙 / 扉(地図) / 行程表 / 奥付 = 4
  const FIXED = 4;
  const target = opts.targetPages ?? Math.max(FIXED + 4, Math.min(48, FIXED + steps.length * 2));
  allocatePages(chapters, Math.max(1, target - FIXED - chapters.length));

  const totalStops = Math.max(steps.length - 1, 1);
  const stopProgress = steps.map((_, i) => i / totalStops);
  const progressOfStop = (s: Step) => {
    const i = steps.indexOf(s);
    return i < 0 ? 0 : stopProgress[i];
  };

  const pages: Page[] = [];
  const visitedCodes = chapters.map((c) => c.prefCode).filter(Boolean);

  pages.push({
    kind: 'cover',
    title: trip.title,
    dateLabel: dateLabel(trip.startDate, trip.endDate),
    hero: steps[0]?.images[0] ?? '',
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

  chapters.forEach((ch) => {
    const first = ch.stops[0];
    pages.push({
      kind: 'chapter',
      prefEn: ch.prefEn,
      prefKanji: ch.prefKanji,
      prefKana: ch.prefKana,
      visitNo: ch.visitNo,
      dateLabel: dateLabel(first?.loggedAt, ch.stops[ch.stops.length - 1]?.loggedAt),
      sekki: sekkiFor(first?.loggedAt ?? ''),
      places: ch.stops.map((s) => s.placeName || s.title),
      progress: progressOfStop(first),
    });

    // その章のページ数だけ写真面を作る
    const slots = ch.pages * 3;
    const photos = pickPhotos(ch, slots);
    let cursor = 0;
    photosPerPage(Math.min(photos.length, ch.pages * 3)).forEach((take, i) => {
      const slice = photos.slice(cursor, cursor + take);
      cursor += take;
      if (!slice.length) return;
      const stop = ch.stops[Math.min(i, ch.stops.length - 1)];
      pages.push({
        kind: 'photos',
        photos: slice,
        caption: stop?.note ?? '',
        place: stop?.placeName || stop?.title || '',
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
      ['Photos', String(steps.reduce((n, s) => n + s.images.length, 0))],
    ],
    progress: 1,
  });

  // 折に合わせて4の倍数へ。足すときは余白の多い「息継ぎ」ページ
  const breatherSource = pages.filter((p): p is Extract<Page, { kind: 'photos' }> => p.kind === 'photos');
  while (pages.length % 4 !== 0) {
    const src = breatherSource[Math.floor(breatherSource.length / 2)];
    const photo = src?.photos[0];
    if (!photo) break;
    pages.splice(pages.length - 1, 0, { kind: 'breather', photo, progress: src.progress });
  }

  return { pages, chapters, stopProgress };
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
