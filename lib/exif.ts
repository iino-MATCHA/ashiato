/**
 * 写真から撮影日時と位置を読む。
 *
 * ライブラリは足さない。読むのは3つ ―― 撮影日時 / 緯度 / 経度。
 *
 * 探し方は3段構え。実機で「位置情報が入っているのに読めない」が出たので、
 * JPEGの構造をたどるだけでは足りないと分かった。
 *
 *   1. JPEGのAPP1(Exif)を正しくたどる（普通のJPEG）
 *   2. 見つからなければ、バイト列から "Exif\0\0" + TIFFヘッダを直接探す
 *      → HEIC/HEIF(iPhoneの既定)・PNGのeXIf・WebPのEXIF・
 *        変わった順でセグメントを並べるJPEG が、これで全部拾える
 *   3. それでも無ければ、日時だけ File.lastModified から拾う
 *
 * 読む範囲も段階的に広げる。EXIFは普通は先頭64KBに入っているが、
 * 大きなサムネイルやMPF（連写・深度情報）を先に置く端末があり、
 * 512KBでは足りないことがある。最初は小さく読み、無ければ広げる。
 */

export interface PhotoMeta {
  /** 撮影日時（ローカル時刻として読む）。取れなければ null */
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
  /** EXIFから取れたか（lastModified で代用した場合は false） */
  fromExif: boolean;
}

/**
 * 読む範囲。小さい順に試して、位置が取れたところで止める。
 * 最後の 8MB は「4800万画素の写真でEXIFがかなり後ろにある」ような例のため。
 * 全部読んでも画素をデコードするわけではないので、負荷は転送だけ。
 */
const STAGES = [256 * 1024, 1024 * 1024, 8 * 1024 * 1024];

export async function readPhotoMeta(file: Blob): Promise<PhotoMeta> {
  // 段を広げながら、取れたものだけを足していく
  // （前の段で日時が取れていたら、次の段で位置だけ増えても日時は捨てない）
  let takenAt: Date | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  for (const bytes of STAGES) {
    if (lat != null) break;                          // 位置が取れたら十分
    if (bytes > file.size && (takenAt || lat != null)) break;
    try {
      const head = await file.slice(0, Math.min(bytes, file.size)).arrayBuffer();
      const view = new DataView(head);
      const found = parseJpeg(view) ?? scanForExif(view);
      if (found) {
        takenAt = takenAt ?? found.takenAt;
        if (lat == null && found.lat != null) { lat = found.lat; lng = found.lng; }
      }
    } catch {
      // 読めなかった段は飛ばす（メモリ不足などで大きい段だけ失敗することがある）
    }
    if (bytes >= file.size) break;
  }

  return {
    takenAt: takenAt ?? fileDate(file),
    lat,
    lng,
    fromExif: !!(takenAt || lat != null),
  };
}

function fileDate(file: Blob): Date | null {
  const lm = (file as File).lastModified;
  if (!lm) return null;
  const d = new Date(lm);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------- 探す

interface RawExif {
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
}

/** ① JPEGのセグメントを順にたどって APP1(Exif) を見つける。 */
function parseJpeg(view: DataView): RawExif | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // SOIが無ければJPEGではない

  let p = 2;
  while (p + 4 <= view.byteLength) {
    if (view.getUint8(p) !== 0xff) break;         // 同期が外れたら諦める（②が拾う）
    const marker = view.getUint8(p + 1);
    if (marker === 0xff) { p += 1; continue; }    // 詰め物
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { p += 2; continue; }
    if (marker === 0xda || marker === 0xd9) break; // 画像データに入ったら終わり
    const len = view.getUint16(p + 2);
    if (len < 2) break;
    if (marker === 0xe1 && p + 10 <= view.byteLength && ascii(view, p + 4, 4) === 'Exif') {
      const r = parseTiff(view, p + 10);
      if (r) return r;
      // XMPなど別のAPP1が先に来ることがあるので、諦めずに次を見る
    }
    p += 2 + len;
  }
  return null;
}

/**
 * ② バイト列から "Exif\0\0" + TIFFヘッダ を直接探す。
 *
 * HEIC は ISO-BMFF のボックス構造で、Exif は item として mdat の中に入る。
 * PNG は eXIf チャンク、WebP は EXIF チャンク。いずれも中身は同じ TIFF で、
 * 直前に "Exif\0\0" が付く形が多い。構造を全部実装するより、この印を
 * 探して TIFF として読むほうが確実で短い。
 *
 * TIFFヘッダ("II*\0" か "MM\0*")の一致まで確認するので、
 * たまたま "Exif" という文字列があっても誤検出しない。
 */
function scanForExif(view: DataView): RawExif | null {
  const n = view.byteLength;
  for (let i = 0; i + 14 <= n; i++) {
    // 'E' 以外は即スキップ（1バイト比較で大半を弾く）
    if (view.getUint8(i) !== 0x45) continue;
    if (
      view.getUint8(i + 1) !== 0x78 || // x
      view.getUint8(i + 2) !== 0x69 || // i
      view.getUint8(i + 3) !== 0x66 || // f
      view.getUint8(i + 4) !== 0x00 ||
      view.getUint8(i + 5) !== 0x00
    ) continue;

    const tiff = i + 6;
    const order = view.getUint16(tiff);
    if (order !== 0x4949 && order !== 0x4d4d) continue;
    const r = parseTiff(view, tiff);
    if (r && (r.lat != null || r.takenAt)) return r;
  }
  return null;
}

// ---------------------------------------------------------------- TIFFを読む

const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME_DIGITIZED = 0x9004;
const TAG_DATETIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LNG_REF = 0x0003;
const TAG_GPS_LNG = 0x0004;

/** tiff = TIFFヘッダの先頭位置。以降のオフセットは全てここが基準。 */
function parseTiff(view: DataView, tiff: number): RawExif | null {
  if (tiff + 8 > view.byteLength) return null;
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 0x002a) return null;

  const ifd0At = tiff + view.getUint32(tiff + 4, le);
  const main = readIfd(view, ifd0At, le);
  if (!main) return null;

  let takenAt: Date | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  const exifPtr = main.get(TAG_EXIF_IFD);
  const sub = exifPtr ? readIfd(view, tiff + numeric(view, tiff, exifPtr, le), le) : null;

  for (const [tag, source] of [
    [TAG_DATETIME_ORIGINAL, sub], [TAG_DATETIME_DIGITIZED, sub], [TAG_DATETIME, main],
  ] as const) {
    if (takenAt || !source) continue;
    const e = source.get(tag);
    if (e) takenAt = parseExifDate(readAscii(view, tiff, e, le));
  }

  const gpsPtr = main.get(TAG_GPS_IFD);
  if (gpsPtr) {
    const gps = readIfd(view, tiff + numeric(view, tiff, gpsPtr, le), le);
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
  // 片方だけ取れても地図には置けない
  if (lat == null || lng == null) { lat = null; lng = null; }

  if (!takenAt && lat == null) return null;
  return { takenAt, lat, lng };
}

interface Entry { type: number; count: number; at: number }

function readIfd(view: DataView, offset: number, le: boolean): Map<number, Entry> | null {
  if (offset < 0 || offset + 2 > view.byteLength) return null;
  const n = view.getUint16(offset, le);
  if (n === 0 || n > 512) return null; // 壊れた読み取り位置に踏み込んだ
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
  return out.size ? out : null;
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
  if (at < 0 || at + e.count > view.byteLength) return '';
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
  if (at < 0 || at + 24 > view.byteLength) return null;
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
  const m = /^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  // 0000:00:00 のような空の値を弾く
  if (isNaN(d.getTime()) || +m[1] < 1900) return null;
  return d;
}
