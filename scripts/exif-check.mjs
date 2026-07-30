/**
 * EXIF読み取りの回帰検査。  npm run check:exif
 *
 * 実機で「位置情報が入っているのに読めない」が繰り返し出たので、
 * 実際の写真の並びを模したバイト列を組んで、落ちる形を固定してある。
 * ここに載っている形は、どれも実機で取りこぼしていたもの。
 *
 * 画素をデコードしないので写真の実物は要らない。
 */
import { readPhotoMeta } from '../.exif-bundle.mjs';
const LAT = [35, 39, 29.1];   // 東京タワー付近
const LNG = [139, 44, 43.7];

function rational(list) {
  const b = Buffer.alloc(list.length * 8);
  list.forEach((v, i) => {
    const den = 1000;
    b.writeUInt32BE(Math.round(v * den), i * 8);
    b.writeUInt32BE(den, i * 8 + 4);
  });
  return b;
}

/**
 * TIFFブロックを組む。
 * withDate / withGps を切り替えて、日時だけ・位置だけ・両方を作れる。
 */
function tiff({ withDate = true, withGps = true, le = false } = {}) {
  const parts = [];
  const head = Buffer.alloc(8);
  if (le) { head.write('II', 0, 'ascii'); head.writeUInt16LE(42, 2); head.writeUInt32LE(8, 4); }
  else { head.write('MM', 0, 'ascii'); head.writeUInt16BE(42, 2); head.writeUInt32BE(8, 4); }

  const u16 = (v) => { const b = Buffer.alloc(2); le ? b.writeUInt16LE(v) : b.writeUInt16BE(v); return b; };
  const u32 = (v) => { const b = Buffer.alloc(4); le ? b.writeUInt32LE(v) : b.writeUInt32BE(v); return b; };
  const rat = (list) => {
    const b = Buffer.alloc(list.length * 8);
    list.forEach((v, i) => {
      const den = 10000;
      if (le) { b.writeUInt32LE(Math.round(v * den), i * 8); b.writeUInt32LE(den, i * 8 + 4); }
      else { b.writeUInt32BE(Math.round(v * den), i * 8); b.writeUInt32BE(den, i * 8 + 4); }
    });
    return b;
  };

  // IFD0 のエントリ: ExifIFDポインタ / GPSIFDポインタ
  const entries0 = [];
  const gpsEntries = [];
  const exifEntries = [];

  const DATE = '2026:04:03 09:12:44\0';

  // 可変データはIFDの後ろに置く。位置は最後に確定させる
  const heap = [];
  let heapBase = 0;
  const push = (buf) => { const at = heapBase + heap.reduce((n, b) => n + b.length, 0); heap.push(buf); return at; };

  const entry = (tag, type, count, valueBuf, inlineValue) => {
    const b = Buffer.alloc(12);
    if (le) { b.writeUInt16LE(tag, 0); b.writeUInt16LE(type, 2); b.writeUInt32LE(count, 4); }
    else { b.writeUInt16BE(tag, 0); b.writeUInt16BE(type, 2); b.writeUInt32BE(count, 4); }
    return { b, valueBuf, inlineValue };
  };

  if (withGps) {
    gpsEntries.push(entry(1, 2, 2, Buffer.from('N\0', 'ascii')));       // LatRef（4バイト以内→埋め込み）
    gpsEntries.push(entry(2, 5, 3, rat(LAT)));
    gpsEntries.push(entry(3, 2, 2, Buffer.from('E\0', 'ascii')));
    gpsEntries.push(entry(4, 5, 3, rat(LNG)));
  }
  if (withDate) {
    exifEntries.push(entry(0x9003, 2, DATE.length, Buffer.from(DATE, 'ascii')));
  }

  // 組み立て: IFD0 → ExifIFD → GPSIFD → ヒープ
  const ifdSize = (n) => 2 + n * 12 + 4;
  const ifd0Count = (withDate ? 1 : 0) + (withGps ? 1 : 0);
  const ifd0At = 8;
  const exifAt = ifd0At + ifdSize(ifd0Count);
  const gpsAt = exifAt + (withDate ? ifdSize(exifEntries.length) : 0);
  heapBase = gpsAt + (withGps ? ifdSize(gpsEntries.length) : 0);

  const writeIfd = (list, at) => {
    const bufs = [u16(list.length)];
    for (const e of list) {
      const size = e.valueBuf ? e.valueBuf.length : 4;
      if (size <= 4) {
        const v = Buffer.alloc(4);
        if (e.valueBuf) e.valueBuf.copy(v, 0);
        else u32(e.inlineValue).copy(v, 0);
        bufs.push(Buffer.concat([e.b.subarray(0, 8), v]));
      } else {
        const off = push(e.valueBuf);
        bufs.push(Buffer.concat([e.b.subarray(0, 8), u32(off)]));
      }
    }
    bufs.push(u32(0));
    return Buffer.concat(bufs);
  };

  const gpsIfd = withGps ? writeIfd(gpsEntries, gpsAt) : Buffer.alloc(0);
  const exifIfd = withDate ? writeIfd(exifEntries, exifAt) : Buffer.alloc(0);

  const ifd0List = [];
  if (withDate) ifd0List.push(entry(0x8769, 4, 1, null, exifAt));
  if (withGps) ifd0List.push(entry(0x8825, 4, 1, null, gpsAt));
  const ifd0 = writeIfd(ifd0List, ifd0At);

  return Buffer.concat([head, ifd0, exifIfd, gpsIfd, ...heap]);
}

function jpegWithExif(tiffBuf, { extraApp1Before = null } = {}) {
  const parts = [Buffer.from([0xff, 0xd8])];
  const app1 = (payload) => {
    const len = Buffer.alloc(2);
    len.writeUInt16BE(payload.length + 2);
    return Buffer.concat([Buffer.from([0xff, 0xe1]), len, payload]);
  };
  if (extraApp1Before) parts.push(app1(extraApp1Before));
  parts.push(app1(Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiffBuf])));
  parts.push(Buffer.from([0xff, 0xda]), Buffer.alloc(64));
  return Buffer.concat(parts);
}

function box(type, payload) {
  const b = Buffer.alloc(8);
  b.writeUInt32BE(payload.length + 8, 0);
  b.write(type, 4, 'ascii');
  return Buffer.concat([b, payload]);
}

/** HEIC風。exifOffset=6 なら "Exif\0\0" 付き、0 ならTIFFが直に来る。 */
function heicLike(tiffBuf, { exifOffset = 6, pad = 0 } = {}) {
  const off = Buffer.alloc(4);
  off.writeUInt32BE(exifOffset);
  const exifItem = exifOffset === 6
    ? Buffer.concat([off, Buffer.from('Exif\0\0', 'ascii'), tiffBuf])
    : Buffer.concat([off, tiffBuf]);
  const mdat = box('mdat', Buffer.concat([Buffer.alloc(pad, 0x11), exifItem, Buffer.alloc(2048, 0x22)]));
  return Buffer.concat([box('ftyp', Buffer.from('heic\0\0\0\0mif1heic', 'ascii')), box('meta', Buffer.alloc(300, 7)), mdat]);
}

/** Node の Buffer を Blob 相当に。lastModified も付ける */
function asFile(buf, name = 'p.jpg') {
  const b = new Blob([buf]);
  b.lastModified = Date.parse('2026-05-01T00:00:00Z');
  b.name = name;
  return b;
}

const CASES = {
  'A. 普通のJPEG (BE)': jpegWithExif(tiff()),
  'B. 普通のJPEG (LE)': jpegWithExif(tiff({ le: true })),
  'C. XMPのAPP1が先に来るJPEG': jpegWithExif(tiff(), { extraApp1Before: Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>', 'ascii') }),
  'D. HEIC (Exif\\0\\0 あり)': heicLike(tiff()),
  'E. HEIC (Exif マーカ無し・TIFF直)': heicLike(tiff(), { exifOffset: 0 }),
  'F. HEIC (Exifが1.5MBの先)': heicLike(tiff(), { pad: 1_500_000 }),
  'G. 位置だけ・日時なし': jpegWithExif(tiff({ withDate: false })),
  'H. 日時だけ・位置なし': jpegWithExif(tiff({ withGps: false })),
  'I. 日時が先・位置は1.2MB先(3MB)': Buffer.concat([
    jpegWithExif(tiff({ withGps: false })), Buffer.alloc(1_200_000, 0x33),
    Buffer.from('Exif\0\0', 'ascii'), tiff({ withDate: false }), Buffer.alloc(1_800_000, 0x44),
  ]),
  'J. Exifが9MB先(12MBファイル)': Buffer.concat([
    Buffer.alloc(9_000_000, 0x55), Buffer.from('Exif\0\0', 'ascii'), tiff(), Buffer.alloc(3_000_000, 0x66),
  ]),
  'K. HEIC(マーカ無し)が0.9MB先': heicLike(tiff(), { exifOffset: 0, pad: 900_000 }),
};

const run = async () => {
  for (const [name, buf] of Object.entries(CASES)) {
    const m = await readPhotoMeta(asFile(buf));
    const okLat = m.lat != null && Math.abs(m.lat - 35.658) < 0.01;
    const okLng = m.lng != null && Math.abs(m.lng - 139.745) < 0.01;
    const wantGps = !name.includes('位置なし');
    const pass = wantGps ? (okLat && okLng) : m.lat == null;
    console.log(
      (pass ? 'PASS ' : 'FAIL ') + name.padEnd(34),
      'lat=' + (m.lat == null ? 'null' : m.lat.toFixed(4)),
      'lng=' + (m.lng == null ? 'null' : m.lng.toFixed(4)),
      'date=' + (m.takenAt ? m.takenAt.toISOString().slice(0, 16) : 'null'),
      'size=' + buf.length
    );
  }
};
run();
