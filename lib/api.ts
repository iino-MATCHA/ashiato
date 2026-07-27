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
import { supabase, isSupabaseConfigured } from './supabase';
import { bump } from './refresh';
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
    .select('id, owner_id, title, description, status, visibility, start_date, end_date')
    .eq('id', id)
    .single();
  if (error || !trip) return null;

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id ?? null;

  const [{ data: logs }, { data: transports }, { data: members }] = await Promise.all([
    supabase
      .from('logs')
      .select('id, title, note, municipality_code, prefecture_code, lat, lng, logged_at, sort_order')
      .eq('trip_id', id)
      .order('sort_order', { ascending: true }),
    supabase.from('transports').select('to_log_id, mode, distance_km').eq('trip_id', id),
    // trip_members has two FKs to profiles (user_id / invited_by) — qualify which one
    supabase.from('trip_members').select('user_id, profiles!trip_members_user_id_fkey(display_name)').eq('trip_id', id),
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
    // 'me' when the signed-in user owns it → controls edit permissions app-wide
    authorId: uid && trip.owner_id === uid ? 'me' : trip.owner_id,
    visibility: (trip.visibility as Trip['visibility']) ?? 'private',
    steps,
  };
}

/**
 * 自分の旅だけ。RLSは公開旅や友達の旅も許可するため、明示的に
 * 「自分が所有 or 自分がメンバー」に絞る（/map は自分の記録だけを出す）。
 */
export async function fetchTrips(): Promise<Trip[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const [{ data: owned }, { data: memberOf }] = await Promise.all([
    supabase.from('trips').select('id, start_date').eq('owner_id', uid),
    supabase.from('trip_members').select('trip_id').eq('user_id', uid),
  ]);
  const ids = new Set<string>((owned ?? []).map((t: any) => t.id));
  (memberOf ?? []).forEach((m: any) => ids.add(m.trip_id));
  if (!ids.size) return [];
  const trips = await Promise.all(Array.from(ids).map((id) => fetchTrip(id)));
  return (trips.filter(Boolean) as Trip[]).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
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

/** サインイン後、profiles 行が無ければ作る（email から username を生成）。 */
export async function ensureProfile(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return;
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existing) return;
  const base = (user.email ?? 'traveller').split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 20) || 'traveller';
  await supabase.from('profiles').upsert({ id: user.id, username: base, display_name: base });
}

/** ログイン中ユーザーが手動登録した訪問都道府県コード。 */
export async function fetchUserPrefectures(): Promise<number[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data } = await supabase.from('user_prefectures').select('prefecture_code').eq('user_id', uid);
  return (data ?? []).map((r: any) => r.prefecture_code);
}

/** 初回オンボ：選んだ都道府県で置き換え保存。 */
export async function saveVisitedPrefectures(codes: number[]): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  await ensureProfile();
  await supabase.from('user_prefectures').delete().eq('user_id', uid);
  if (codes.length) {
    const rows = codes.map((c) => ({ user_id: uid, prefecture_code: c }));
    const { error } = await supabase.from('user_prefectures').insert(rows);
    if (error) return false;
  }
  bump('visited'); // notify goshuin/profile to refetch without a reload
  return true;
}

/**
 * 画像を縮小圧縮（Web）。createImageBitmap が使えない形式（HEIC等の一部）でも
 * <img> デコードにフォールバックして必ずJPEG化を試みる。最終手段は元blob。
 */
async function compressImage(blob: Blob, maxDim = 1280, quality = 0.72): Promise<Blob> {
  if (typeof document === 'undefined') return blob;

  const toJpeg = (w: number, h: number, paint: (ctx: CanvasRenderingContext2D, cw: number, ch: number) => void): Promise<Blob | null> => {
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    paint(ctx, cw, ch);
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  };

  // 1) createImageBitmap（最速）
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bmp = await createImageBitmap(blob);
      const out = await toJpeg(bmp.width, bmp.height, (ctx, cw, ch) => ctx.drawImage(bmp, 0, 0, cw, ch));
      if (out) return out;
    } catch {}
  }
  // 2) <img> decode フォールバック（Safari の HEIC などをカバー）
  try {
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    if (img.decode) await img.decode();
    else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const out = await toJpeg(img.naturalWidth, img.naturalHeight, (ctx, cw, ch) => ctx.drawImage(img, 0, 0, cw, ch));
    URL.revokeObjectURL(url);
    if (out) return out;
  } catch {}
  return blob;
}

/** Storage にアップロードして storage_path を返す。key は衝突回避用の識別子。 */
export async function uploadPhoto(uid: string, tripId: string, fileOrBlob: Blob, key = 'p'): Promise<string | null> {
  const compressed = await compressImage(fileOrBlob);
  const rand = Math.random().toString(36).slice(2, 9);
  const path = `${uid}/${tripId}/${key}-${rand}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  return path;
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

export async function updateTrip(id: string, input: { title?: string; visibility?: string; startDate?: string | null; endDate?: string | null; coverPhotoUrl?: string }): Promise<boolean> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.startDate !== undefined) patch.start_date = input.startDate || null;
  if (input.endDate !== undefined) patch.end_date = input.endDate || null;
  if (input.coverPhotoUrl !== undefined) patch.cover_photo_url = input.coverPhotoUrl;
  const { error } = await supabase.from('trips').update(patch).eq('id', id);
  return !error;
}

/** 旅のカバー写真をアップロードして公開URLを返す。 */
export async function uploadTripCover(tripId: string, blob: Blob): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const path = await uploadPhoto(uid, tripId, blob, 'cover');
    return path ? publicUrl(path) : null;
  } catch {
    return null;
  }
}

/** プロフィール画像をアップロードして公開URLを返す。 */
export async function uploadAvatar(blob: Blob): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const path = await uploadPhoto(uid, 'avatar', blob, 'avatar');
    return path ? publicUrl(path) : null;
  } catch {
    return null;
  }
}

export async function deleteTrip(id: string): Promise<boolean> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  return !error;
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
}): Promise<{ id: string | null; photoFailed: number }> {
  const uid = await currentUserId();
  if (!uid) return { id: null, photoFailed: 0 };
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
  if (error || !log) return { id: null, photoFailed: 0 };

  if (sortOrder > 0) {
    await supabase.from('transports').insert({ trip_id: input.tripId, to_log_id: log.id, mode: input.transport, distance_km: 0 });
  }

  const blobs = input.photoBlobs ?? [];
  let photoFailed = 0;
  for (let i = 0; i < blobs.length; i++) {
    try {
      const path = await uploadPhoto(uid, input.tripId, blobs[i], `${log.id}-${i}`);
      if (path) await supabase.from('photos').insert({ log_id: log.id, trip_id: input.tripId, uploader_id: uid, storage_path: path, sort_order: i });
      else photoFailed++;
    } catch {
      photoFailed++; // keep the stop even if a photo fails
    }
  }
  bump('visited');
  bump('trips');
  return { id: log.id, photoFailed };
}

// ---------------------------------------------------------------- step social (likes / comments)
export interface StepComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}
export interface StepSocial {
  likes: number;
  likedByMe: boolean;
  comments: StepComment[];
}

export async function fetchStepSocial(logId: string): Promise<StepSocial> {
  const uid = await currentUserId();
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('reactions').select('user_id').eq('target_type', 'log').eq('target_id', logId),
    supabase.from('comments').select('id, body, created_at, author_id, profiles(display_name)').eq('log_id', logId).order('created_at', { ascending: true }),
  ]);
  return {
    likes: (reactions ?? []).length,
    likedByMe: !!uid && (reactions ?? []).some((r: any) => r.user_id === uid),
    comments: (comments ?? []).map((c: any) => ({
      id: c.id,
      author: c.profiles?.display_name ?? 'Traveller',
      body: c.body,
      createdAt: (c.created_at ?? '').slice(0, 10),
    })),
  };
}

export async function toggleLike(logId: string, tripId: string, liked: boolean): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  if (liked) {
    await supabase.from('reactions').delete().eq('target_type', 'log').eq('target_id', logId).eq('user_id', uid).eq('emoji', '❤️');
  } else {
    await supabase.from('reactions').insert({ trip_id: tripId, target_type: 'log', target_id: logId, user_id: uid, emoji: '❤️' });
  }
  return true;
}

export async function addComment(logId: string, tripId: string, body: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid || !body.trim()) return false;
  const { error } = await supabase.from('comments').insert({ trip_id: tripId, log_id: logId, author_id: uid, body: body.trim() });
  return !error;
}

// ---------------------------------------------------------------- comment notifications
export interface CommentNotification {
  commentId: string;
  body: string;
  author: string;
  createdAt: string;
  logId: string;
  tripId: string;
  stepTitle: string;
  photo: string | null;
}

/** 未読通知 = 自分のStepへの他人のコメントで、notification_reads に無いもの。 */
export async function fetchCommentNotifications(): Promise<CommentNotification[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data: myLogs } = await supabase.from('logs').select('id, title, trip_id').eq('author_id', uid);
  const ids = (myLogs ?? []).map((l: any) => l.id);
  if (!ids.length) return [];

  const [{ data: comments }, { data: reads }, { data: photos }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, body, created_at, author_id, log_id, trip_id, profiles(display_name)')
      .in('log_id', ids)
      .neq('author_id', uid)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('notification_reads').select('comment_id').eq('user_id', uid),
    supabase.from('photos').select('log_id, storage_path, sort_order').in('log_id', ids).order('sort_order', { ascending: true }),
  ]);

  const readSet = new Set((reads ?? []).map((r: any) => r.comment_id));
  const photoByLog = new Map<string, string>();
  (photos ?? []).forEach((p: any) => {
    if (!photoByLog.has(p.log_id)) photoByLog.set(p.log_id, publicUrl(p.storage_path));
  });
  const logMap = new Map((myLogs ?? []).map((l: any) => [l.id, l]));

  return (comments ?? [])
    .filter((c: any) => !readSet.has(c.id))
    .map((c: any) => ({
      commentId: c.id,
      body: c.body,
      author: c.profiles?.display_name ?? 'Traveller',
      createdAt: (c.created_at ?? '').slice(0, 10),
      logId: c.log_id,
      tripId: c.trip_id,
      stepTitle: (logMap.get(c.log_id) as any)?.title ?? 'Your stop',
      photo: photoByLog.get(c.log_id) ?? null,
    }));
}

/** 右スワイプで既読化。 */
export async function markNotificationRead(commentId: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase.from('notification_reads').upsert({ user_id: uid, comment_id: commentId });
  return !error;
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    return (await fetchCommentNotifications()).length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------- friends
export interface UserSummary {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

function toUser(p: any): UserSummary {
  return {
    id: p.id,
    name: p.display_name ?? p.username ?? 'Traveller',
    username: p.username ?? '',
    avatarUrl: p.avatar_url ?? '',
  };
}

/** ユーザー検索（自分以外・username/表示名の部分一致）。 */
export async function searchUsers(q: string): Promise<UserSummary[]> {
  const uid = await currentUserId();
  const term = q.trim();
  if (!term) return [];
  const like = `%${term}%`;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.${like},display_name.ilike.${like}`)
    .limit(12);
  return (data ?? []).filter((p: any) => p.id !== uid).map(toUser);
}

/** おすすめ（自分と友達以外の最新ユーザー）。 */
export async function fetchSuggestedUsers(): Promise<UserSummary[]> {
  const uid = await currentUserId();
  const friends = await fetchFriends();
  const exclude = new Set([uid, ...friends.map((f) => f.id)]);
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []).filter((p: any) => !exclude.has(p.id)).slice(0, 8).map(toUser);
}

export async function sendFriendRequest(addresseeId: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid || uid === addresseeId) return false;
  const { error } = await supabase.from('friend_requests').insert({ requester_id: uid, addressee_id: addresseeId });
  return !error;
}

export interface FriendRequest {
  id: string;
  from: UserSummary;
  createdAt: string;
}

/** 自分宛の保留中申請（友達ページに通知として表示）。 */
export async function fetchFriendRequests(): Promise<FriendRequest[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data } = await supabase
    .from('friend_requests')
    .select('id, created_at, profiles!friend_requests_requester_id_fkey(id, username, display_name, avatar_url)')
    .eq('addressee_id', uid)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    from: toUser(r.profiles ?? {}),
    createdAt: (r.created_at ?? '').slice(0, 10),
  }));
}

/** 承認/拒否。承認時は 0002 のトリガが friendships を生成する。 */
export async function respondFriendRequest(requestId: string, accept: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', requestId);
  return !error;
}

export async function fetchFriends(): Promise<UserSummary[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data } = await supabase.from('friendships').select('user_a, user_b');
  const otherIds = (data ?? []).map((f: any) => (f.user_a === uid ? f.user_b : f.user_a));
  if (!otherIds.length) return [];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', otherIds);
  return (profiles ?? []).map(toUser);
}

export async function removeFriend(otherId: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const a = uid < otherId ? uid : otherId;
  const b = uid < otherId ? otherId : uid;
  const { error } = await supabase.from('friendships').delete().eq('user_a', a).eq('user_b', b);
  // また申請し直せるように、過去の申請行も消しておく
  await supabase.from('friend_requests').delete()
    .or(`and(requester_id.eq.${uid},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${uid})`);
  return !error;
}

export async function fetchUserProfile(id: string): Promise<UserSummary | null> {
  const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', id).maybeSingle();
  return data ? toUser(data) : null;
}

/** 指定ユーザーの旅（RLSが公開範囲を自動判定：public＋友達ならfriendsも）。 */
export async function fetchTripsByOwner(ownerId: string): Promise<Trip[]> {
  const { data } = await supabase.from('trips').select('id').eq('owner_id', ownerId).order('start_date', { ascending: false });
  if (!data) return [];
  const trips = await Promise.all(data.map((t: any) => fetchTrip(t.id)));
  return trips.filter(Boolean) as Trip[];
}

/** 友達（または本人）の訪問都道府県コード。RPCがRLS相当の判定を行う。 */
export async function fetchVisitedPrefecturesOf(userId: string): Promise<number[]> {
  const { data, error } = await supabase.rpc('visited_prefectures_of', { p_user: userId });
  if (error || !data) return [];
  return (data as any[]).map((r) => (typeof r === 'number' ? r : r.visited_prefectures_of)).filter((n) => n != null);
}

// ---------------------------------------------------------------- admin
export async function fetchMyAdminRole(): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data } = await supabase.from('profiles').select('admin_role').eq('id', uid).maybeSingle();
  return data?.admin_role ?? null;
}

export async function fetchAdminStats(): Promise<any | null> {
  const { data, error } = await supabase.rpc('admin_stats');
  return error ? null : data;
}

export async function fetchAdminOrders(): Promise<any[] | null> {
  const { data, error } = await supabase.rpc('admin_orders');
  return error ? null : (data as any[] | null);
}

export async function fetchAdmins(): Promise<{ username: string; name: string; role: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name, admin_role')
    .not('admin_role', 'is', null);
  return (data ?? []).map((p: any) => ({ username: p.username, name: p.display_name ?? p.username, role: p.admin_role }));
}

export async function setAdminRole(username: string, role: string | null): Promise<boolean> {
  const { data, error } = await supabase.rpc('set_admin_role', { p_username: username, p_role: role ?? '' });
  return !error && data === true;
}

// ---------------------------------------------------------------- step update
/** 既存Stepの更新（場所は変更不可。タイトル・本文・日付のみ）＋写真の追加。 */
export async function updateStep(logId: string, input: { title?: string; note?: string; loggedAt?: string; tripId?: string; newPhotos?: Blob[] }): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.note !== undefined) patch.note = input.note;
  if (input.loggedAt !== undefined) patch.logged_at = input.loggedAt;
  const { error } = await supabase.from('logs').update(patch).eq('id', logId);
  if (error) return false;

  const blobs = input.newPhotos ?? [];
  if (blobs.length && input.tripId) {
    const { count } = await supabase.from('photos').select('id', { count: 'exact', head: true }).eq('log_id', logId);
    let order = count ?? 0;
    for (const b of blobs) {
      try {
        const path = await uploadPhoto(uid, input.tripId, b, `${logId}-${order}`);
        if (path) await supabase.from('photos').insert({ log_id: logId, trip_id: input.tripId, uploader_id: uid, storage_path: path, sort_order: order });
        order++;
      } catch {}
    }
  }
  bump('trips');
  return true;
}

/** 記録→カウント→ユーザー：訪問済み都道府県コード(1..47)。RPC my_visited_prefectures を使用。 */
export async function fetchVisitedPrefectureCodes(): Promise<number[]> {
  const { data, error } = await supabase.rpc('my_visited_prefectures');
  if (error || !data) return [];
  return (data as any[]).map((r) => (typeof r === 'number' ? r : r.my_visited_prefectures)).filter((n) => n != null);
}
