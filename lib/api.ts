/**
 * Supabase データアクセス層（既存マスタ対応）。
 * DBスキーマ（0001/0002）を app の型（lib/mock の Trip/Step/Goshuin）へマップする。
 * Supabase 未設定時は呼び出し側でモックにフォールバックする（lib/useData 参照）。
 *
 * 座標は municipalities_master(latitude/longitude) を参照（地図ピン）。
 * 都道府県は Prefecture_master(prefecture_code 1..47) を参照。
 * マスタへの外部キーは張っていないため PostgREST の自動結合は使わず、
 * コードで in() 取得して突き合わせる。
 */
import { supabase } from './supabase';
import type { Trip, Step, Goshuin, TransportMode } from './mock';

const PHOTO_BUCKET = 'photos';

function publicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

function toTransport(mode?: string | null): TransportMode {
  const m = (mode ?? '').toLowerCase();
  const allowed: TransportMode[] = ['car', 'train', 'shinkansen', 'plane', 'walk', 'ferry'];
  return (allowed as string[]).includes(m) ? (m as TransportMode) : 'train';
}

type Muni = {
  municipality_code: number;
  prefecture_code: number;
  prefecture_en: string;
  municipality_en: string;
  latitude: number;
  longitude: number;
};

async function fetchMunicipalities(codes: number[]): Promise<Map<number, Muni>> {
  const map = new Map<number, Muni>();
  const unique = Array.from(new Set(codes.filter((c) => c != null)));
  if (!unique.length) return map;
  const { data } = await supabase
    .from('municipalities_master')
    .select('municipality_code, prefecture_code, prefecture_en, municipality_en, latitude, longitude')
    .in('municipality_code', unique);
  (data ?? []).forEach((m: any) => map.set(m.municipality_code, m as Muni));
  return map;
}

/** Prefecture_master: code(1..47) -> 英語名 */
async function fetchPrefectureNames(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const { data } = await supabase
    .from('Prefecture_master')
    .select('prefecture_code, prefecture_en');
  (data ?? []).forEach((p: any) => map.set(p.prefecture_code, p.prefecture_en));
  return map;
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('id, title, description, status, start_date, end_date')
    .eq('id', id)
    .single();
  if (error || !trip) return null;

  const [{ data: logs }, { data: transports }, { data: members }] = await Promise.all([
    supabase
      .from('logs')
      .select('id, title, note, municipality_code, prefecture_code, lat, lng, logged_at, sort_order')
      .eq('trip_id', id)
      .order('sort_order', { ascending: true }),
    supabase.from('transports').select('to_log_id, mode, distance_km').eq('trip_id', id),
    supabase.from('trip_members').select('user_id, profiles(display_name)').eq('trip_id', id),
  ]);

  const logRows = logs ?? [];
  const logIds = logRows.map((l: any) => l.id);
  const muniCodes = logRows.map((l: any) => l.municipality_code).filter(Boolean);

  const [{ data: photos }, munis] = await Promise.all([
    logIds.length
      ? supabase.from('photos').select('log_id, storage_path, sort_order').in('log_id', logIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    fetchMunicipalities(muniCodes),
  ]);

  const photosByLog = new Map<string, string[]>();
  (photos ?? []).forEach((p: any) => {
    const arr = photosByLog.get(p.log_id) ?? [];
    arr.push(publicUrl(p.storage_path));
    photosByLog.set(p.log_id, arr);
  });
  const transportByTo = new Map<string, string>();
  (transports ?? []).forEach((t: any) => transportByTo.set(t.to_log_id, t.mode));

  const steps: Step[] = logRows.map((l: any) => {
    const m = l.municipality_code ? munis.get(l.municipality_code) : undefined;
    return {
      id: l.id,
      title: l.title ?? m?.municipality_en ?? 'Untitled',
      placeName: m?.municipality_en ?? '',
      prefectureName: m?.prefecture_en ?? '',
      note: l.note ?? '',
      loggedAt: (l.logged_at ?? '').slice(0, 10),
      lng: Number(l.lng ?? m?.longitude) || 0,
      lat: Number(l.lat ?? m?.latitude) || 0,
      images: photosByLog.get(l.id) ?? [],
      transport: toTransport(transportByTo.get(l.id)),
    };
  });

  const prefectures = Array.from(new Set(steps.map((s) => s.prefectureName).filter(Boolean)));
  const distanceKm = Math.round(
    (transports ?? []).reduce((sum: number, t: any) => sum + (Number(t.distance_km) || 0), 0)
  );

  return {
    id: trip.id,
    title: trip.title,
    subtitle: prefectures.join(' · '),
    status: (trip.status as Trip['status']) ?? 'completed',
    startDate: trip.start_date ?? '',
    endDate: trip.end_date ?? '',
    prefectures,
    members: (members ?? []).map((m: any) => m.profiles?.display_name ?? 'Traveller'),
    distanceKm,
    steps,
  };
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id')
    .order('start_date', { ascending: false });
  if (error || !data) return [];
  const trips = await Promise.all(data.map((t: any) => fetchTrip(t.id)));
  return trips.filter(Boolean) as Trip[];
}

/** Public trips for the Explore feed. */
export async function fetchPublicTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id')
    .eq('visibility', 'public')
    .order('start_date', { ascending: false });
  if (error || !data) return [];
  const trips = await Promise.all(data.map((t: any) => fetchTrip(t.id)));
  return trips.filter(Boolean) as Trip[];
}

export async function fetchGoshuin(): Promise<Goshuin[]> {
  const [{ data: masters }, { data: mine }, prefNames] = await Promise.all([
    supabase.from('goshuin_masters').select('id, name, rarity, prefecture_code').eq('is_active', true),
    supabase.from('user_goshuin').select('goshuin_master_id, acquired_at'),
    fetchPrefectureNames(),
  ]);
  const acquiredMap = new Map<string, string>();
  (mine ?? []).forEach((g: any) => acquiredMap.set(g.goshuin_master_id, g.acquired_at));

  return (masters ?? []).map((m: any) => ({
    id: m.id,
    prefectureId: m.prefecture_code,
    prefectureName: prefNames.get(m.prefecture_code) ?? '',
    name: m.name,
    rarity: m.rarity,
    acquired: acquiredMap.has(m.id),
    acquiredAt: acquiredMap.get(m.id)?.slice(0, 10),
    kanji: (m.name ?? '·').slice(0, 1),
  }));
}

// ---------------------------------------------------------------- check-in search
export interface PlaceHit {
  key: string;
  title: string;      // 場所名（tourism area か 市区町村名）
  subtitle: string;   // 市区町村 / 都道府県
  municipalityCode: number;
  prefectureCode?: number;
  lat?: number;
  lng?: number;
}

/** 検索バー用: tourism_area_master と municipalities_master を横断検索。都道府県では検索しない。 */
export async function searchPlaces(q: string): Promise<PlaceHit[]> {
  const term = q.trim();
  if (!isSupabaseConfigured || term.length < 1) return [];
  const like = `%${term}%`;
  const [{ data: areas }, { data: munis }] = await Promise.all([
    supabase
      .from('tourism_area_master')
      .select('tourism_area_id, name_en, name_ja, municipality_en, municipality_code')
      .or(`name_en.ilike.${like},name_ja.ilike.${like}`)
      .limit(8),
    supabase
      .from('municipalities_master')
      .select('municipality_code, municipality_en, municipality_ja, prefecture_en, prefecture_code, latitude, longitude')
      .or(`municipality_en.ilike.${like},municipality_ja.ilike.${like}`)
      .limit(8),
  ]);

  const hits: PlaceHit[] = [];
  (areas ?? []).forEach((a: any) =>
    hits.push({
      key: `a:${a.tourism_area_id}`,
      title: a.name_en || a.name_ja,
      subtitle: a.municipality_en ?? '',
      municipalityCode: a.municipality_code,
    })
  );
  (munis ?? []).forEach((m: any) =>
    hits.push({
      key: `m:${m.municipality_code}`,
      title: m.municipality_en || m.municipality_ja,
      subtitle: m.prefecture_en ?? '',
      municipalityCode: m.municipality_code,
      prefectureCode: m.prefecture_code,
      lat: m.latitude,
      lng: m.longitude,
    })
  );
  return hits;
}

/** tourism area 選択時など、municipality_code から座標・都道府県を解決。 */
export async function resolvePlace(municipalityCode: number): Promise<{ lat: number; lng: number; prefectureCode: number; prefectureEn: string } | null> {
  const { data } = await supabase
    .from('municipalities_master')
    .select('latitude, longitude, prefecture_code, prefecture_en')
    .eq('municipality_code', municipalityCode)
    .single();
  if (!data) return null;
  return { lat: data.latitude, lng: data.longitude, prefectureCode: data.prefecture_code, prefectureEn: data.prefecture_en };
}

// ---------------------------------------------------------------- writes
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/** 画像を画質を保ったまま縮小圧縮（Web）。ネイティブは非対応でそのまま返す。 */
async function compressImage(blob: Blob, maxDim = 1600, quality = 0.82): Promise<Blob> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return blob;
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0, w, h);
    const out: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    return out ?? blob;
  } catch {
    return blob;
  }
}

/** Storage にアップロードして storage_path を返す。 */
export async function uploadPhoto(uid: string, tripId: string, fileOrBlob: Blob): Promise<string | null> {
  try {
    const compressed = await compressImage(fileOrBlob);
    const path = `${uid}/${tripId}/${Math.round(compressed.size)}-${compressed.type.includes('png') ? 'p' : 'j'}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

export async function createTrip(input: { title: string; visibility?: string; startDate?: string; endDate?: string }): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from('trips')
    .insert({ owner_id: uid, title: input.title, visibility: input.visibility ?? 'private', status: 'ongoing', start_date: input.startDate, end_date: input.endDate })
    .select('id')
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function createStep(input: {
  tripId: string;
  title: string;
  note: string;
  municipalityCode: number;
  prefectureCode: number;
  loggedAt: string;
  transport: string;
  photoBlobs?: Blob[];
}): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  // 末尾に追加するため sort_order = 現在の件数
  const { count } = await supabase.from('logs').select('id', { count: 'exact', head: true }).eq('trip_id', input.tripId);
  const sortOrder = count ?? 0;

  const { data: log, error } = await supabase
    .from('logs')
    .insert({
      trip_id: input.tripId, author_id: uid, title: input.title, note: input.note,
      municipality_code: input.municipalityCode, prefecture_code: input.prefectureCode,
      logged_at: input.loggedAt, sort_order: sortOrder,
    })
    .select('id')
    .single();
  if (error || !log) return null;

  if (sortOrder > 0) {
    await supabase.from('transports').insert({ trip_id: input.tripId, to_log_id: log.id, mode: input.transport, distance_km: 0 });
  }

  const blobs = input.photoBlobs ?? [];
  for (let i = 0; i < blobs.length; i++) {
    const path = await uploadPhoto(uid, input.tripId, blobs[i]);
    if (path) await supabase.from('photos').insert({ log_id: log.id, trip_id: input.tripId, uploader_id: uid, storage_path: path, sort_order: i });
  }
  return log.id;
}

/** 記録→カウント→ユーザー：訪問済み都道府県コード(1..47)。RPC my_visited_prefectures を使用。 */
export async function fetchVisitedPrefectureCodes(): Promise<number[]> {
  const { data, error } = await supabase.rpc('my_visited_prefectures');
  if (error || !data) return [];
  return (data as any[]).map((r) => (typeof r === 'number' ? r : r.my_visited_prefectures)).filter((n) => n != null);
}
