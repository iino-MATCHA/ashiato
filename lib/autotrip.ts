/**
 * 写真を選ぶだけで旅の記録を起こす。
 *
 * やること
 *   1. 各写真のEXIFから撮影日時と位置を読む（lib/exif）
 *   2. 時間と距離でまとまりに割る = 立ち寄り先
 *   3. まとまりの中心から市区町村を引く（RPC nearest_municipality）
 *   4. 地名と日付だけをAIへ渡して旅の題をもらう（写真は送らない）
 *   5. 旅 → 立ち寄り先の順に作り、写真をぶら下げる
 *
 * 手入力の導線とデータの形は変えない。作られる旅は /trip で普通に編集できる。
 * 立ち寄り先の題は市区町村名のまま。AIが名づけるのは旅の題だけ。
 */
import { readPhotoMeta, type PhotoMeta } from './exif';
import {
  createTrip, createStep, nearestMunicipality, suggestTripTitle,
  haversineKm, type NearestPlace,
} from './api';
import { getLocale } from './i18n';

/** 同じ立ち寄り先とみなす距離。市区町村の広さに合わせた。 */
const SAME_PLACE_KM = 12;
/** 撮影がこれ以上あいたら、同じ場所でも別の立ち寄り先として分ける。 */
const SAME_VISIT_HOURS = 8;
/** 1つの旅として扱う上限。これを超えて離れた日付は切り捨てず、旅を長くする。 */
const MAX_STOPS = 30;

export type AutoTripPhase = 'reading' | 'placing' | 'naming' | 'saving';

export interface AutoTripProgress {
  phase: AutoTripPhase;
  done: number;
  total: number;
}

export type AutoTripFailure =
  | 'no-photos'      // 1枚も渡されていない
  | 'no-location'    // 位置情報が1枚も入っていない
  | 'not-japan'      // 位置はあるが日本の外
  | 'save-failed';   // DBに書けなかった

export interface AutoTripResult {
  tripId: string | null;
  failure: AutoTripFailure | null;
  /** 作られた立ち寄り先の数 */
  stops: number;
  /** ぶら下げられた写真の数 */
  photos: number;
  /** 位置が無くて置けなかった写真の数 */
  skipped: number;
  /** AIが題をつけたか（false なら地名から組んだ） */
  aiTitle: boolean;
}

interface Shot {
  file: Blob;
  meta: PhotoMeta;
}

interface Cluster {
  lat: number;
  lng: number;
  from: Date;
  to: Date;
  shots: Shot[];
  place?: NearestPlace | null;
}

/**
 * 写真から旅を1件作る。
 * onProgress は画面のローディング表示に流す。
 */
export async function createTripFromPhotos(
  files: Blob[],
  onProgress?: (p: AutoTripProgress) => void
): Promise<AutoTripResult> {
  const empty: AutoTripResult = { tripId: null, failure: null, stops: 0, photos: 0, skipped: 0, aiTitle: false };
  if (!files.length) return { ...empty, failure: 'no-photos' };

  // ---- 1. EXIF を読む -------------------------------------------------
  const shots: Shot[] = [];
  for (let i = 0; i < files.length; i++) {
    shots.push({ file: files[i], meta: await readPhotoMeta(files[i]) });
    onProgress?.({ phase: 'reading', done: i + 1, total: files.length });
  }

  const located = shots.filter((s) => s.meta.lat != null && s.meta.lng != null);
  if (!located.length) return { ...empty, failure: 'no-location', skipped: shots.length };

  // ---- 2. まとまりに割る ----------------------------------------------
  // 撮った順に並べ、前の写真から離れたか時間が空いたら新しい立ち寄り先にする。
  located.sort((a, b) => time(a) - time(b));

  const clusters: Cluster[] = [];
  for (const s of located) {
    const lat = s.meta.lat as number;
    const lng = s.meta.lng as number;
    const at = new Date(time(s));
    const cur = clusters[clusters.length - 1];
    const far = !cur || haversineKm({ lat: cur.lat, lng: cur.lng }, { lat, lng }) > SAME_PLACE_KM;
    const late = !!cur && (at.getTime() - cur.to.getTime()) / 3_600_000 > SAME_VISIT_HOURS;

    if (!cur || far || late) {
      clusters.push({ lat, lng, from: at, to: at, shots: [s] });
      continue;
    }
    // 中心は写真の平均。1枚ぶんずつ寄せていく
    const n = cur.shots.length;
    cur.lat = (cur.lat * n + lat) / (n + 1);
    cur.lng = (cur.lng * n + lng) / (n + 1);
    cur.to = at;
    cur.shots.push(s);
  }

  // 位置の無い写真は、時間が一番近いまとまりへ入れる（捨てない）
  let skipped = 0;
  for (const s of shots) {
    if (s.meta.lat != null && s.meta.lng != null) continue;
    if (!s.meta.takenAt) { skipped++; continue; }
    const t = s.meta.takenAt.getTime();
    let best: Cluster | null = null;
    let bestGap = Infinity;
    for (const c of clusters) {
      const gap = t < c.from.getTime() ? c.from.getTime() - t : t > c.to.getTime() ? t - c.to.getTime() : 0;
      if (gap < bestGap) { bestGap = gap; best = c; }
    }
    // 半日以上離れていたら、その旅の写真ではないとみなす
    if (best && bestGap / 3_600_000 <= 12) best.shots.push(s);
    else skipped++;
  }

  // ---- 3. 市区町村を引く ----------------------------------------------
  const kept: Cluster[] = [];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    c.place = await nearestMunicipality(c.lat, c.lng);
    onProgress?.({ phase: 'placing', done: i + 1, total: clusters.length });
    if (!c.place) continue; // 日本の外
    const prev = kept[kept.length - 1];
    // 同じ市区町村が続いたら1つにまとめる（駅前と寺で2つに割れても意味がない）
    if (prev && prev.place?.municipalityCode === c.place.municipalityCode) {
      prev.shots.push(...c.shots);
      prev.to = c.to;
      continue;
    }
    kept.push(c);
  }
  if (!kept.length) return { ...empty, failure: 'not-japan', skipped: shots.length };

  // 上限を超えたぶんは黙って落とさない。落ちた写真は skipped に足して画面に出す
  const stops = kept.slice(0, MAX_STOPS);
  for (const dropped of kept.slice(MAX_STOPS)) skipped += dropped.shots.length;
  const startDate = day(stops[0].from);
  const endDate = day(stops[stops.length - 1].to);

  // ---- 4. 題をつける ---------------------------------------------------
  onProgress?.({ phase: 'naming', done: 0, total: 1 });
  const places = stops.map((c) => placeLabel(c.place!));
  const days = Math.max(1, Math.round((stops[stops.length - 1].to.getTime() - stops[0].from.getTime()) / 86_400_000) + 1);
  const ai = await suggestTripTitle({ places, start: startDate, end: endDate, days, locale: getLocale() });
  const title = ai || fallbackTitle(places, startDate);
  onProgress?.({ phase: 'naming', done: 1, total: 1 });

  // ---- 5. 保存 ---------------------------------------------------------
  const tripId = await createTrip({
    title,
    visibility: 'private',
    startDate,
    endDate,
    status: 'completed', // 過去に撮った写真から起こすので、進行中にはしない
  });
  if (!tripId) return { ...empty, failure: 'save-failed', skipped };

  let photos = 0;
  for (let i = 0; i < stops.length; i++) {
    const c = stops[i];
    const prev = i > 0 ? stops[i - 1] : null;
    const legKm = prev ? haversineKm({ lat: prev.lat, lng: prev.lng }, { lat: c.lat, lng: c.lng }) : 0;
    const blobs = c.shots.map((s) => s.file);
    const res = await createStep({
      tripId,
      title: c.place!.municipalityEn,
      note: '',
      municipalityCode: c.place!.municipalityCode,
      prefectureCode: c.place!.prefectureCode,
      loggedAt: day(c.from),
      transport: guessTransport(legKm),
      // 市区町村の代表点ではなく、実際に撮った場所へピンを打つ
      lat: c.lat,
      lng: c.lng,
      photoBlobs: blobs,
    });
    photos += blobs.length - res.photoFailed;
    onProgress?.({ phase: 'saving', done: i + 1, total: stops.length });
  }

  return { tripId, failure: null, stops: stops.length, photos, skipped, aiTitle: !!ai };
}

// ---------------------------------------------------------------- 小物

function time(s: Shot): number {
  return s.meta.takenAt ? s.meta.takenAt.getTime() : 0;
}

function day(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function placeLabel(p: NearestPlace): string {
  return p.municipalityEn && p.prefectureEn && p.municipalityEn !== p.prefectureEn
    ? `${p.municipalityEn}, ${p.prefectureEn}`
    : p.prefectureEn || p.municipalityEn;
}

/** 区間の距離から移動手段を推す。あとから /trip で直せる。 */
function guessTransport(km: number): string {
  if (km < 3) return 'walk';
  if (km < 150) return 'train';
  if (km < 600) return 'shinkansen';
  return 'plane';
}

/** AIが使えないときの題。地名と季節から組む。 */
function fallbackTitle(places: string[], startDate: string): string {
  const heads = Array.from(new Set(places.map((p) => p.split(',')[0].trim()))).slice(0, 3);
  const month = Number(startDate.slice(5, 7));
  const season =
    month <= 2 || month === 12 ? 'Winter' : month <= 5 ? 'Spring' : month <= 8 ? 'Summer' : 'Autumn';
  if (!heads.length) return `${season} in Japan`;
  if (heads.length === 1) return `${season} in ${heads[0]}`;
  return `${heads.slice(0, -1).join(', ')} & ${heads[heads.length - 1]}`;
}
