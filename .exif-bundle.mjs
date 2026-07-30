// lib/exif.ts
var MAX_SCAN = 64 * 1024 * 1024;
var STAGES = [256 * 1024, 2 * 1024 * 1024, 16 * 1024 * 1024, MAX_SCAN];
async function readPhotoMeta(file) {
  let takenAt = null;
  let lat = null;
  let lng = null;
  let read = 0;
  for (const stage of STAGES) {
    if (lat != null) break;
    const bytes = Math.min(stage, file.size, MAX_SCAN);
    if (bytes <= read) break;
    read = bytes;
    try {
      const head = await file.slice(0, bytes).arrayBuffer();
      const view = new DataView(head);
      const found = search(view);
      if (found) {
        takenAt = takenAt ?? found.takenAt;
        if (lat == null && found.lat != null) {
          lat = found.lat;
          lng = found.lng;
        }
      }
    } catch {
    }
    if (bytes >= file.size) break;
  }
  return {
    takenAt: takenAt ?? fileDate(file),
    lat,
    lng,
    fromExif: !!(takenAt || lat != null)
  };
}
function fileDate(file) {
  const lm = file.lastModified;
  if (!lm) return null;
  const d = new Date(lm);
  return isNaN(d.getTime()) ? null : d;
}
function search(view) {
  const out = { takenAt: null, lat: null, lng: null };
  const take = (r) => {
    if (!r) return;
    out.takenAt = out.takenAt ?? r.takenAt;
    if (out.lat == null && r.lat != null) {
      out.lat = r.lat;
      out.lng = r.lng;
    }
  };
  take(parseJpeg(view));
  if (out.lat == null) take(scanForExif(view));
  if (out.lat == null) take(scanForTiff(view));
  return out.takenAt || out.lat != null ? out : null;
}
function parseJpeg(view) {
  if (view.byteLength < 4 || view.getUint16(0) !== 65496) return null;
  let p = 2;
  while (p + 4 <= view.byteLength) {
    if (view.getUint8(p) !== 255) break;
    const marker = view.getUint8(p + 1);
    if (marker === 255) {
      p += 1;
      continue;
    }
    if (marker === 216 || marker === 1 || marker >= 208 && marker <= 215) {
      p += 2;
      continue;
    }
    if (marker === 218 || marker === 217) break;
    const len = view.getUint16(p + 2);
    if (len < 2) break;
    if (marker === 225 && p + 10 <= view.byteLength && ascii(view, p + 4, 4) === "Exif") {
      const r = parseTiff(view, p + 10);
      if (r) return r;
    }
    p += 2 + len;
  }
  return null;
}
function scanForExif(view) {
  const n = view.byteLength;
  let best = null;
  for (let i = 0; i + 14 <= n; i++) {
    if (view.getUint8(i) !== 69) continue;
    if (view.getUint8(i + 1) !== 120 || // x
    view.getUint8(i + 2) !== 105 || // i
    view.getUint8(i + 3) !== 102 || // f
    view.getUint8(i + 4) !== 0 || view.getUint8(i + 5) !== 0) continue;
    const tiff = i + 6;
    const order = view.getUint16(tiff);
    if (order !== 18761 && order !== 19789) continue;
    const r = parseTiff(view, tiff);
    if (r?.lat != null) return r;
    if (r?.takenAt && !best) best = r;
  }
  return best;
}
function scanForTiff(view) {
  const n = Math.min(view.byteLength, MAX_SCAN);
  let best = null;
  for (let i = 0; i + 16 <= n; i += 2) {
    const a = view.getUint8(i);
    if (a !== 73 && a !== 77) continue;
    const le = a === 73;
    if (view.getUint8(i + 1) !== a) continue;
    if (view.getUint16(i + 2, le) !== 42) continue;
    const first = view.getUint32(i + 4, le);
    if (first < 8 || first > 65536) continue;
    const r = parseTiff(view, i);
    if (r?.lat != null) return r;
    if (r?.takenAt && !best) best = r;
  }
  return best;
}
var TAG_DATETIME_ORIGINAL = 36867;
var TAG_DATETIME_DIGITIZED = 36868;
var TAG_DATETIME = 306;
var TAG_EXIF_IFD = 34665;
var TAG_GPS_IFD = 34853;
var TAG_GPS_LAT_REF = 1;
var TAG_GPS_LAT = 2;
var TAG_GPS_LNG_REF = 3;
var TAG_GPS_LNG = 4;
function parseTiff(view, tiff) {
  if (tiff + 8 > view.byteLength) return null;
  const order = view.getUint16(tiff);
  if (order !== 18761 && order !== 19789) return null;
  const le = order === 18761;
  if (view.getUint16(tiff + 2, le) !== 42) return null;
  const ifd0At = tiff + view.getUint32(tiff + 4, le);
  const main = readIfd(view, ifd0At, le);
  if (!main) return null;
  let takenAt = null;
  let lat = null;
  let lng = null;
  const exifPtr = main.get(TAG_EXIF_IFD);
  const sub = exifPtr ? readIfd(view, tiff + numeric(view, tiff, exifPtr, le), le) : null;
  for (const [tag, source] of [
    [TAG_DATETIME_ORIGINAL, sub],
    [TAG_DATETIME_DIGITIZED, sub],
    [TAG_DATETIME, main]
  ]) {
    if (takenAt || !source) continue;
    const e = source.get(tag);
    if (e) takenAt = parseExifDate(readAscii(view, tiff, e, le));
  }
  const gpsPtr = main.get(TAG_GPS_IFD);
  if (gpsPtr) {
    const gps = readIfd(view, tiff + numeric(view, tiff, gpsPtr, le), le);
    if (gps) {
      lat = coordinate(view, tiff, gps, TAG_GPS_LAT, TAG_GPS_LAT_REF, "S", le);
      lng = coordinate(view, tiff, gps, TAG_GPS_LNG, TAG_GPS_LNG_REF, "W", le);
    }
  }
  if (lat != null && lng != null && Math.abs(lat) < 1e-3 && Math.abs(lng) < 1e-3) {
    lat = null;
    lng = null;
  }
  if (lat == null || lng == null) {
    lat = null;
    lng = null;
  }
  if (!takenAt && lat == null) return null;
  return { takenAt, lat, lng };
}
function readIfd(view, offset, le) {
  if (offset < 0 || offset + 2 > view.byteLength) return null;
  const n = view.getUint16(offset, le);
  if (n === 0 || n > 512) return null;
  const out = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    const at = offset + 2 + i * 12;
    if (at + 12 > view.byteLength) break;
    out.set(view.getUint16(at, le), {
      type: view.getUint16(at + 2, le),
      count: view.getUint32(at + 4, le),
      at
    });
  }
  return out.size ? out : null;
}
var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
function valueAt(view, tiff, e, le) {
  const size = (TYPE_SIZE[e.type] ?? 1) * e.count;
  return size <= 4 ? e.at + 8 : tiff + view.getUint32(e.at + 8, le);
}
function numeric(view, tiff, e, le) {
  const at = valueAt(view, tiff, e, le);
  if (at + 4 > view.byteLength) return 0;
  return e.type === 3 ? view.getUint16(at, le) : view.getUint32(at, le);
}
function readAscii(view, tiff, e, le) {
  const at = valueAt(view, tiff, e, le);
  if (at < 0 || at + e.count > view.byteLength) return "";
  return ascii(view, at, e.count).replace(/\0.*$/, "");
}
function ascii(view, at, len) {
  let s = "";
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(at + i));
  return s;
}
function coordinate(view, tiff, gps, tagValue, tagRef, negativeRef, le) {
  const e = gps.get(tagValue);
  if (!e || e.type !== 5 || e.count < 3) return null;
  const at = valueAt(view, tiff, e, le);
  if (at < 0 || at + 24 > view.byteLength) return null;
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(at + i * 8, le);
    const den = view.getUint32(at + i * 8 + 4, le);
    parts.push(den ? num / den : 0);
  }
  let deg = parts[0] + parts[1] / 60 + parts[2] / 3600;
  if (!isFinite(deg)) return null;
  const refEntry = gps.get(tagRef);
  const ref = refEntry ? readAscii(view, tiff, refEntry, le).trim().toUpperCase() : "";
  if (ref === negativeRef) deg = -deg;
  return Math.abs(deg) > 180 ? null : deg;
}
function parseExifDate(s) {
  const m = /^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  if (isNaN(d.getTime()) || +m[1] < 1900) return null;
  return d;
}
export {
  readPhotoMeta
};
