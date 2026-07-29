/**
 * 写真から撮影日時と位置を読む。
 *
 * ライブラリは足さない。JPEG の APP1(Exif) だけを自前で読む。
 * 読むのは3つ ―― 撮影日時 / 緯度 / 経度。それ以外には触らない。
 *
 * 端末やSNSを経由した写真はEXIFが落ちていることがある。その場合は
 * 日時だけ File.lastModified から拾い、位置は null のまま返す
 * （位置が1枚も取れない旅は地図に置けないので、呼び出し側で断る）。
 */

export interface PhotoMeta {
  /** 撮影日時（ローカル時刻として読む）。取れなければ null */
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
  /** EXIFから取れたか（lastModified で代用した場合は false） */
  fromExif: boolean;
}

/** EXIFは先頭に入る。全部読むと重いので頭だけ見る。 */
const HEAD_BYTES = 512 * 1024;

export async function readPhotoMeta(file: Blob): Promise<PhotoMeta> {
  const fallback: PhotoMeta = {
    takenAt: fileDate(file),
    lat: null,
    lng: null,
    fromExif: false,
  };
  try {
    const head = await file.slice(0, HEAD_BYTES).arrayBuffer();
    const exif = parseExif(new DataView(head));
    if (!exif) return fallback;
    return {
      takenAt: exif.takenAt ?? fallback.takenAt,
      lat: exif.lat,
      lng: exif.lng,
      fromExif: !!(exif.takenAt || exif.lat != null),
    };
  } catch {
    return fallback;
  }
}

function fileDate(file: Blob): Date | null {
  const lm = (file as File).lastModified;
  if (!lm) return null;
  const d = new Date(lm);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------- EXIF

const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME_DIGITIZED = 0x9004;
const TAG_DATETIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LNG_REF = 0x0003;
const TAG_GPS_LNG = 0x0004;

interface RawExif {
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
}

function parseExif(view: DataView): RawExif | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // SOI が無ければJPEGではない

  // APP1 マーカーを探す
  let p = 2;
  let tiff = -1;
  while (p + 4 <= view.byteLength) {
    if (view.getUint8(p) !== 0xff) break;
    const marker = view.getUint8(p + 1);
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { p += 2; continue; }
    if (marker === 0xda) break; // 画像データに入ったら終わり
    const len = view.getUint16(p + 2);
    if (marker === 0xe1 && p + 10 <= view.byteLength && ascii(view, p + 4, 4) === 'Exif') {
      tiff = p + 10;
      break;
    }
    p += 2 + len;
  }
  if (tiff < 0 || tiff + 8 > view.byteLength) return null;

  // バイト order（II=リトル / MM=ビッグ）
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 0x002a) return null;

  const ifd0 = tiff + view.getUint32(tiff + 4, le);
  const main = readIfd(view, tiff, ifd0, le);
  if (!main) return null;

  let takenAt: Date | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  const exifPtr = main.get(TAG_EXIF_IFD);
  const sub = exifPtr ? readIfd(view, tiff, tiff + Number(numeric(view, tiff, exifPtr, le)), le) : null;

  for (const [tag, source] of [
    [TAG_DATETIME_ORIGINAL, sub], [TAG_DATETIME_DIGITIZED, sub], [TAG_DATETIME, main],
  ] as const) {
    if (takenAt || !source) continue;
    const e = source.get(tag);
    if (e) takenAt = parseExifDate(readAscii(view, tiff, e, le));
  }

  const gpsPtr = main.get(TAG_GPS_IFD);
  if (gpsPtr) {
    const gps = readIfd(view, tiff, tiff + Number(numeric(view, tiff, gpsPtr, le)), le);
    if (gps) {
      lat = coordinate(view, tiff, gps, TAG_GPS_LAT, TAG_GPS_LAT_REF, 'S', le);
      lng = coordinate(view, tiff, gps, TAG_GPS_LNG, TAG_GPS_LNG_REF, 'W', le);
    }
  }

  // 0,0 は「取れなかった」の別表現なので捨てる（ギニア湾に旅は無い）
  if (lat != null && lng != null && Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
    lat = null;
    lng = null;
  }

  return { takenAt, lat, lng };
}

interface Entry { type: number; count: number; at: number }

function readIfd(view: DataView, tiff: number, offset: number, le: boolean): Map<number, Entry> | null {
  if (offset + 2 > view.byteLength) return null;
  const n = view.getUint16(offset, le);
  if (n > 512) return null; // 壊れた読み取り位置に踏み込んだ
  const out = new Map<number, Entry>();
  for (let i = 0; i < n; i++) {
    const at = offset + 2 + i * 12;
    if (at + 12 > view.byteLength) break;
    out.set(view.getUint16(at, le), {
      type: view.getUint16(at + 2, le),
      count: view.getUint32(at + 4, le),
      at,
    });
  }
  return out;
}

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

/** 値の置き場所。4バイトに収まるならエントリ内、超えるならオフセット先。 */
function valueAt(view: DataView, tiff: number, e: Entry, le: boolean): number {
  const size = (TYPE_SIZE[e.type] ?? 1) * e.count;
  return size <= 4 ? e.at + 8 : tiff + view.getUint32(e.at + 8, le);
}

function numeric(view: DataView, tiff: number, e: Entry, le: boolean): number {
  const at = valueAt(view, tiff, e, le);
  if (at + 4 > view.byteLength) return 0;
  return e.type === 3 ? view.getUint16(at, le) : view.getUint32(at, le);
}

function readAscii(view: DataView, tiff: number, e: Entry, le: boolean): string {
  const at = valueAt(view, tiff, e, le);
  if (at + e.count > view.byteLength) return '';
  return ascii(view, at, e.count).replace(/\0.*$/, '');
}

function ascii(view: DataView, at: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(at + i));
  return s;
}

/** 度分秒(RATIONAL×3) + N/S/E/W を10進度へ。 */
function coordinate(
  view: DataView, tiff: number, gps: Map<number, Entry>,
  tagValue: number, tagRef: number, negativeRef: string, le: boolean
): number | null {
  const e = gps.get(tagValue);
  if (!e || e.type !== 5 || e.count < 3) return null;
  const at = valueAt(view, tiff, e, le);
  if (at + 24 > view.byteLength) return null;
  const parts: number[] = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(at + i * 8, le);
    const den = view.getUint32(at + i * 8 + 4, le);
    parts.push(den ? num / den : 0);
  }
  let deg = parts[0] + parts[1] / 60 + parts[2] / 3600;
  if (!isFinite(deg)) return null;
  const refEntry = gps.get(tagRef);
  const ref = refEntry ? readAscii(view, tiff, refEntry, le).trim().toUpperCase() : '';
  if (ref === negativeRef) deg = -deg;
  return Math.abs(deg) > 180 ? null : deg;
}

/** EXIFの日時は "2026:04:03 09:12:44"。ローカル時刻として読む。 */
function parseExifDate(s: string): Date | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return isNaN(d.getTime()) ? null : d;
}
