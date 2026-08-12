/**
 * 「地図に置いてよい座標か」の唯一の判定。
 *
 * lat/lng が null のstopは、assembleTrips が 0 に潰して返す
 * （市区町村マスタが引けないときのフォールバック切れでも 0 になる）。
 * その (0,0) をそのまま Mapbox やシェアカードに渡すと、ピンが
 * ギニア湾（アフリカ沖）に落ちる ―― 実際に「日本縦断」で起きた。
 *
 * 描画側はこの関数で必ず弾く。日本の外接矩形
 * （緯度20〜46・経度122〜154。与那国島〜択捉島・南鳥島まで入る）に
 * 収まらない座標は「座標なし」と扱い、ピンを描かない。
 */
export const JAPAN_BOUNDS = { minLat: 20, maxLat: 46, minLng: 122, maxLng: 154 } as const;

export function isJapanCoord(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  return (
    la >= JAPAN_BOUNDS.minLat && la <= JAPAN_BOUNDS.maxLat &&
    ln >= JAPAN_BOUNDS.minLng && ln <= JAPAN_BOUNDS.maxLng
  );
}
