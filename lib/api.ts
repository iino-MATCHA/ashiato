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
import { prefectureCodeForQuery, PREFECTURE_EN_BY_ID } from './prefectures';
import { bump } from './refresh';
import type { Trip, Step, TransportMode } from './mock';
import { mockMatchaArticles } from './mock';
import { getLocale } from './i18n';
import { isJapanCoord } from './coords';

const PHOTO_BUCKET = 'photos';

export function publicUrl(path: string): string {
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

/**
 * 表示言語に対応する列名。
 * マスタは5言語ぶんの名前を持っているので、英語で固定せず表示言語で引く。
 * その言語の名前が空なら英語へ落とす（マスタの埋まり具合はまちまち）。
 */
const NAME_COL: Record<string, { pref: string; muni: string }> = {
  en: { pref: 'prefecture_en', muni: 'municipality_en' },
  ja: { pref: 'prefecture_ja', muni: 'municipality_ja' },
  ko: { pref: 'prefecture_ko', muni: 'municipality_ko' },
  'zh-Hans': { pref: 'prefecture_zh_hans', muni: 'municipality_zh_hans' },
  'zh-Hant': { pref: 'prefecture_zh_hant', muni: 'municipality_zh_hant' },
};

async function fetchMunicipalities(codes: number[]): Promise<Map<number, Muni>> {
  const map = new Map<number, Muni>();
  const unique = Array.from(new Set(codes.filter((c) => c != null)));
  if (!unique.length) return map;
  const col = NAME_COL[getLocale()] ?? NAME_COL.en;
  const { data } = await supabase
    .from('municipalities_master')
    .select(
      `municipality_code, prefecture_code, latitude, longitude,` +
      ` prefecture_en, municipality_en, ${col.pref}, ${col.muni}`
    )
    .in('municipality_code', unique);
  (data ?? []).forEach((m: any) =>
    map.set(m.municipality_code, {
      municipality_code: m.municipality_code,
      prefecture_code: m.prefecture_code,
      latitude: m.latitude,
      longitude: m.longitude,
      // その言語の名前が無ければ英語で埋める
      prefecture_en: m[col.pref] || m.prefecture_en,
      municipality_en: m[col.muni] || m.municipality_en,
    })
  );
  return map;
}

const TRIP_COLS = 'id, owner_id, title, description, status, visibility, start_date, end_date';
const LOG_COLS = 'id, trip_id, title, note, municipality_code, prefecture_code, lat, lng, logged_at, sort_order';

/**
 * 旅の行から Trip[] を組み立てる。
 *
 * **旅の件数に関わらず問い合わせは6回で済ませる。** 以前は旅ごとに
 * fetchTrip() を呼んでいたので、1件あたり6回 × 件数だけ往復していた。
 * Exploreの19件で130回を超え、地下鉄のような遅い回線では開くまでに
 * 分単位かかっていた。まとめて引いてメモリ側で突き合わせる。
 */
async function assembleTrips(tripRows: any[]): Promise<Trip[]> {
  if (!tripRows.length) return [];
  const tripIds = tripRows.map((t) => t.id);
  const ownerIds = Array.from(new Set(tripRows.map((t) => t.owner_id).filter(Boolean)));

  // getSession はローカル読み取り（通信なし）。未ログインでも公開旅はRLSが通す
  const uid = await currentUserId();

  const [{ data: logs }, { data: transports }, { data: members }, { data: owners }] = await Promise.all([
    supabase.from('logs').select(LOG_COLS).in('trip_id', tripIds).order('sort_order', { ascending: true }),
    supabase.from('transports').select('trip_id, to_log_id, mode, distance_km').in('trip_id', tripIds),
    // trip_members has two FKs to profiles (user_id / invited_by) — qualify which one
    supabase.from('trip_members').select('trip_id, user_id, profiles!trip_members_user_id_fkey(display_name)').in('trip_id', tripIds),
    ownerIds.length
      ? supabase.from('profiles').select('id, username').in('id', ownerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const logRows = logs ?? [];
  const logIds = logRows.map((l: any) => l.id);

  const [{ data: photos }, munis] = await Promise.all([
    logIds.length
      ? supabase.from('photos').select('log_id, storage_path, sort_order').in('log_id', logIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    fetchMunicipalities(logRows.map((l: any) => l.municipality_code).filter(Boolean)),
  ]);

  const photosByLog = new Map<string, string[]>();
  (photos ?? []).forEach((ph: any) => {
    const arr = photosByLog.get(ph.log_id) ?? [];
    arr.push(publicUrl(ph.storage_path));
    photosByLog.set(ph.log_id, arr);
  });

  const logsByTrip = new Map<string, any[]>();
  logRows.forEach((l: any) => {
    const arr = logsByTrip.get(l.trip_id) ?? [];
    arr.push(l);
    logsByTrip.set(l.trip_id, arr);
  });

  const transportByTo = new Map<string, { mode: string; km: number }>();
  (transports ?? []).forEach((tr: any) =>
    transportByTo.set(tr.to_log_id, { mode: tr.mode, km: Number(tr.distance_km) || 0 })
  );

  const membersByTrip = new Map<string, string[]>();
  // 表示名だけでなくIDも控える。誰が直せるかの判定に使う
  const memberIdsByTrip = new Map<string, Set<string>>();
  (members ?? []).forEach((m: any) => {
    const arr = membersByTrip.get(m.trip_id) ?? [];
    arr.push(m.profiles?.display_name ?? 'Traveller');
    membersByTrip.set(m.trip_id, arr);
    const ids = memberIdsByTrip.get(m.trip_id) ?? new Set<string>();
    ids.add(m.user_id);
    memberIdsByTrip.set(m.trip_id, ids);
  });

  const usernameById = new Map<string, string>();
  (owners ?? []).forEach((o: any) => usernameById.set(o.id, o.username));

  return tripRows.map((trip: any) => {
    const rows = logsByTrip.get(trip.id) ?? [];
    const steps: Step[] = rows.map((l: any) => {
      const m = l.municipality_code ? munis.get(l.municipality_code) : undefined;
      return {
        id: l.id,
        title: l.title ?? m?.municipality_en ?? 'Untitled',
        placeName: m?.municipality_en ?? '',
        /**
         * 県の名前はマスタの突き合わせに頼らない。
         * logs には prefecture_code が直接入っているので、手元の一覧から引く。
         * マスタが読めない状態（0031で修理した事故）のとき、ここが空だと
         * 県カードの「みんなの旅」が全県で空になった（実際に起きた）。
         */
        prefectureName: m?.prefecture_en ?? PREFECTURE_EN_BY_ID[l.prefecture_code ?? 0] ?? '',
        note: l.note ?? '',
        loggedAt: (l.logged_at ?? '').slice(0, 10),
        lng: Number(l.lng ?? m?.longitude) || 0,
        lat: Number(l.lat ?? m?.latitude) || 0,
        images: photosByLog.get(l.id) ?? [],
        transport: toTransport(transportByTo.get(l.id)?.mode),
      };
    });

    const prefectures = Array.from(new Set(steps.map((st) => st.prefectureName).filter(Boolean)));

    // 区間の距離。保存済みの値があればそれを使い、無い（0の）区間は
    // 前の地点との大円距離で補う。これが無いと総距離がいつまでも 0 km になる。
    let distanceKm = 0;
    for (let i = 1; i < steps.length; i++) {
      const stored = transportByTo.get(steps[i].id)?.km ?? 0;
      distanceKm += stored > 0 ? stored : haversineKm(steps[i - 1], steps[i]);
    }

    const ownerUsername = usernameById.get(trip.owner_id);
    return {
      id: trip.id,
      title: trip.title,
      subtitle: prefectures.join(' · '),
      status: (trip.status as Trip['status']) ?? 'completed',
      startDate: trip.start_date ?? '',
      endDate: trip.end_date ?? '',
      prefectures,
      members: membersByTrip.get(trip.id) ?? [],
      distanceKm: Math.round(distanceKm),
      // 'me' when the signed-in user owns it → controls edit permissions app-wide
      authorId: uid && trip.owner_id === uid ? 'me' : trip.owner_id,
      ownerUsername,
      sample: ownerUsername === 'ashiato_demo',
      visibility: (trip.visibility as Trip['visibility']) ?? 'private',
      // 持ち主か、その旅の travel buddy なら直せる
      canEdit: !!uid && (trip.owner_id === uid || memberIdsByTrip.get(trip.id)?.has(uid) === true),
      steps,
    };
  });
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select(TRIP_COLS).eq('id', id).maybeSingle();
  if (error || !data) return null;
  const [trip] = await assembleTrips([data]);
  return trip ?? null;
}

/**
 * 自分の旅だけ。RLSは公開旅や友達の旅も許可するため、明示的に
 * 「自分が所有 or 自分がメンバー」に絞る（/map は自分の記録だけを出す）。
 */
export async function fetchTrips(): Promise<Trip[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const [{ data: owned }, { data: memberOf }] = await Promise.all([
    supabase.from('trips').select('id').eq('owner_id', uid),
    supabase.from('trip_members').select('trip_id').eq('user_id', uid),
  ]);
  const ids = new Set<string>((owned ?? []).map((t: any) => t.id));
  (memberOf ?? []).forEach((m: any) => ids.add(m.trip_id));
  if (!ids.size) return [];
  const { data } = await supabase.from('trips').select(TRIP_COLS).in('id', Array.from(ids));
  const trips = await assembleTrips(data ?? []);
  return trips.sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
}

/** Public trips for the Explore feed. */
export async function fetchPublicTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_COLS)
    .eq('visibility', 'public')
    .order('start_date', { ascending: false })
    .limit(40);
  if (error || !data) return [];
  return assembleTrips(data);
}

// 御朱印は「訪問した都道府県」から導く（RPC my_visited_prefectures）。
// マスタを引いていた fetchGoshuin は 0017 でテーブルごと廃止した。

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

const MUNI_COLS =
  'municipality_code, municipality_en, municipality_ja, municipality_ko, municipality_zh_hans,' +
  ' municipality_zh_hant, prefecture_en, prefecture_ja, prefecture_ko, prefecture_zh_hans,' +
  ' prefecture_zh_hant, prefecture_code, latitude, longitude';

function toMuniHit(m: any): PlaceHit {
  // 検索結果も表示言語で見せる。無ければ英語、それも無ければ日本語
  const col = NAME_COL[getLocale()] ?? NAME_COL.en;
  return {
    key: `m:${m.municipality_code}`,
    title: m[col.muni] || m.municipality_en || m.municipality_ja,
    subtitle: m[col.pref] || m.prefecture_en || '',
    municipalityCode: m.municipality_code,
    prefectureCode: m.prefecture_code,
    lat: m.latitude,
    lng: m.longitude,
  };
}

/**
 * 検索バー用: tourism_area_master と municipalities_master を横断検索。
 *
 * 都道府県名でも引けるようにする。ただし**都道府県そのものは候補に出さない** ――
 * 「東京都」に立ち寄ったという記録は粗すぎて地図にも御朱印にも使えないので、
 * 都道府県名が入力されたときは、その中の市区町村を並べて選ばせる。
 */
export async function searchPlaces(q: string): Promise<PlaceHit[]> {
  const term = q.trim();
  if (!isSupabaseConfigured || term.length < 1) return [];
  const like = `%${term}%`;

  // 「Tokyo」「東京」「東京都」のように都道府県を指していないか先に見る
  const prefCode = prefectureCodeForQuery(term);

  const [{ data: areas }, { data: munis }, inPref] = await Promise.all([
    supabase
      .from('tourism_area_master')
      .select(AREA_COLS + ', municipality_code')
      .or(`name_en.ilike.${like},name_ja.ilike.${like}`)
      .limit(8),
    supabase
      .from('municipalities_master')
      .select(MUNI_COLS)
      .or(`municipality_en.ilike.${like},municipality_ja.ilike.${like}`)
      .limit(8),
    prefCode
      ? supabase
          .from('municipalities_master')
          .select(MUNI_COLS)
          .eq('prefecture_code', prefCode)
          .order('municipality_code', { ascending: true })
          .limit(30)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const hits: PlaceHit[] = [];
  const seen = new Set<string>();
  const push = (h: PlaceHit) => {
    if (seen.has(h.key)) return;
    seen.add(h.key);
    hits.push(h);
  };

  // 検索結果も表示言語で見せる
  const areaCol = AREA_NAME_COL[getLocale()] ?? AREA_NAME_COL.en;
  (areas ?? []).forEach((a: any) =>
    push({
      key: `a:${a.tourism_area_id}`,
      title: a[areaCol.name] || a.name_en || a.name_ja,
      subtitle: a[areaCol.muni] || a.municipality_en || '',
      municipalityCode: a.municipality_code,
    })
  );
  (munis ?? []).forEach((m: any) => push(toMuniHit(m)));
  // 都道府県名で引いたぶんは最後に。名前が直接当たったものを先に見せる
  ((inPref as any).data ?? []).forEach((m: any) => push(toMuniHit(m)));

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
/**
 * 現在のユーザーID。
 * getUser() は毎回 /auth/v1/user へ問い合わせに行くため、電波が不安定な端末では
 * 失敗して「ログインしているのに未ログイン扱い」になることがある。
 * セッションはローカルに保持されているので getSession() を使う（通信なし）。
 */
export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
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

/** これより大きい画像は、そのまま送らない（下の理由参照）。 */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/**
 * 制御をUIへ返す。
 * 画像の処理は重いので、まとめて回すと画面が固まる。1枚ごとに挟む。
 */
export function yieldToUi(): Promise<void> {
  return new Promise((res) => setTimeout(res, 0));
}

/**
 * 画像を縮小圧縮（Web）。
 *
 * 重要なのは「必ず小さくしてから送る」こと。
 * 4800万画素クラスの写真をそのまま canvas に載せると、端末によっては
 * toBlob が黙って null を返す（キャンバスの面積上限）。以前はその場合に
 * 元のblobをそのまま返していたので、10MB超のファイルを送ろうとして
 * 電波の弱い場所では必ず失敗していた。
 *
 * そこで:
 *   1. createImageBitmap の resizeWidth/Height で**デコードの時点で縮める**。
 *      巨大な画像をメモリに広げないので、上限にも当たらず速い
 *   2. 使えない環境では <img> デコード → canvas（従来どおり）
 *   3. どちらも駄目なら、元が十分小さいときだけ素通し。
 *      大きいままなら null を返して「失敗」として扱う（黙って送らない）
 */
async function compressImage(blob: Blob, maxDim = 1280, quality = 0.72): Promise<Blob | null> {
  if (typeof document === 'undefined') return blob;

  const encode = (source: CanvasImageSource, w: number, h: number): Promise<Blob | null> => {
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    try {
      ctx.drawImage(source, 0, 0, cw, ch);
    } catch {
      return Promise.resolve(null);
    }
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  };

  // 1) デコードしながら縮める。ここを通ればメモリも時間も一番軽い
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const probe = await createImageBitmap(blob);
      const w = probe.width;
      const h = probe.height;
      probe.close?.();
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const bmp = scale < 1
        ? await createImageBitmap(blob, {
            resizeWidth: Math.round(w * scale),
            resizeHeight: Math.round(h * scale),
            resizeQuality: 'high',
          })
        : await createImageBitmap(blob);
      const out = await encode(bmp, bmp.width, bmp.height);
      bmp.close?.();
      if (out) return out;
    } catch {}
  }

  // 2) <img> デコード（Safari の HEIC などをカバー）
  let url: string | null = null;
  try {
    url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    if (img.decode) await img.decode();
    else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const out = await encode(img, img.naturalWidth, img.naturalHeight);
    if (out) return out;
  } catch {
  } finally {
    if (url) URL.revokeObjectURL(url);
  }

  // 3) 縮められなかった。小さいものだけ素通しし、大きいものは送らない
  return blob.size <= MAX_UPLOAD_BYTES ? blob : null;
}

/**
 * Storage にアップロードして storage_path を返す。key は衝突回避用の識別子。
 * 縮小できなかった大きい画像は送らずに null を返す（呼び出し側が失敗として数える）。
 */
export async function uploadPhoto(uid: string, tripId: string, fileOrBlob: Blob, key = 'p'): Promise<string | null> {
  const compressed = await compressImage(fileOrBlob);
  if (!compressed) return null;
  const rand = Math.random().toString(36).slice(2, 9);
  const path = `${uid}/${tripId}/${key}-${rand}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  return path;
}

export async function createTrip(input: { title: string; visibility?: string; startDate?: string; endDate?: string; status?: string }): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from('trips')
    .insert({ owner_id: uid, title: input.title, visibility: input.visibility ?? 'private', status: input.status ?? 'ongoing', start_date: input.startDate, end_date: input.endDate })
    .select('id')
    .single();
  if (error || !data) return null;
  return data.id;
}

/**
 * 一緒に行った人（travel buddy）を旅に加える。
 * trip_members に載った人は、その旅を見て記録も足せる。
 * 追加できるのは持ち主だけ（RLS 側でも同じ条件をかけている）。
 */
export async function setTripBuddies(tripId: string, userIds: string[]): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const keep = userIds.filter((x) => x && x !== uid);

  // いま載っている人を読み、差分だけ足し引きする
  const { data } = await supabase.from('trip_members').select('user_id').eq('trip_id', tripId);
  const now = (data ?? []).map((r: any) => r.user_id as string).filter((x) => x !== uid);
  const add = keep.filter((x) => !now.includes(x));
  const drop = now.filter((x) => !keep.includes(x));

  if (add.length) {
    const { error } = await supabase
      .from('trip_members')
      .insert(add.map((user_id) => ({ trip_id: tripId, user_id, role: 'editor', invited_by: uid })));
    if (error) return false;
  }
  if (drop.length) {
    // 持ち主は落とさない（上で uid を除いてある）
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .in('user_id', drop);
    if (error) return false;
  }
  bump('trips');
  return true;
}

/** その旅に載っている人（持ち主を除く）。 */
/**
 * 旅ごとの合鍵。招待リンクに載せる。
 * 持ち主とバディーだけが引ける（RLSが旅そのものを守っている）。
 */
export async function fetchInviteToken(tripId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.from('trips').select('invite_token').eq('id', tripId).maybeSingle();
  return (data as any)?.invite_token ?? null;
}

/** 合鍵から旅のidを引く。リンクを開いた時点ではidを知らない */
export async function tripIdByInvite(token: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.rpc('trip_id_by_invite', { p_token: token });
  return (data as string) ?? null;
}

/**
 * 合鍵を持っている人を、その旅のバディーとして入れる。
 * 登録を終えた直後に呼ぶ。すでに入っていれば何も起きない。
 */
export async function joinTripByInvite(token: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('trip_join_by_invite', { p_token: token });
  if (error) return null;
  return (data as string) ?? null;
}

export async function fetchTripBuddies(tripId: string): Promise<UserSummary[]> {
  const uid = await currentUserId();
  const { data } = await supabase
    .from('trip_members')
    .select('user_id, profiles!trip_members_user_id_fkey(id, username, display_name, avatar_url)')
    .eq('trip_id', tripId);
  return (data ?? [])
    .filter((r: any) => r.user_id !== uid && r.profiles)
    .map((r: any) => toUser(r.profiles));
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
  /** 実際の座標が分かっている場合（写真のEXIFなど）。無ければ市区町村の代表点を使う。 */
  lat?: number;
  lng?: number;
  /** 写真を1枚処理し終えるたびに呼ばれる（画面の進捗表示用）。 */
  onPhoto?: (done: number, total: number) => void;
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
      lat: input.lat ?? null, lng: input.lng ?? null,
      logged_at: input.loggedAt, sort_order: sortOrder,
    })
    .select('id')
    .single();
  if (error || !log) return { id: null, photoFailed: 0 };

  if (sortOrder > 0) {
    // 直前の地点からの距離を入れておく（分析の平均距離がここを読む）
    const prev = await previousStopCoords(input.tripId, sortOrder);
    const here = (await fetchMunicipalities([input.municipalityCode])).get(input.municipalityCode);
    const distance = prev && here
      ? Math.round(haversineKm(prev, { lat: Number(here.latitude), lng: Number(here.longitude) }))
      : 0;
    await supabase.from('transports').insert({
      trip_id: input.tripId, to_log_id: log.id, mode: input.transport, distance_km: distance,
    });
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
    input.onPhoto?.(i + 1, blobs.length);
    // 1枚ごとに制御を返す。画像のデコードは重いので、これを挟まないと
    // 画面が固まり、写真ピッカーの「決定」まで押せなくなる端末がある
    await yieldToUi();
  }
  bump('visited');
  bump('trips');
  return { id: log.id, photoFailed };
}

/**
 * 立ち寄り先を時系列に並べ直す。
 * 追加は常に末尾なので、古い日付のものを足したあとはこれを呼ぶ。
 * 区間の距離も新しい並びで測り直される（移動手段は触らない）。
 */
export async function resortTripStops(tripId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.rpc('resort_trip_stops', { p_trip: tripId });
  if (!error) bump('trips');
  return !error;
}

/** 1つ前の地点の座標（logs 自身に無ければ市区町村マスタから）。 */
async function previousStopCoords(
  tripId: string,
  sortOrder: number
): Promise<{ lat: number; lng: number } | null> {
  const { data } = await supabase
    .from('logs')
    .select('lat, lng, municipality_code')
    .eq('trip_id', tripId)
    .eq('sort_order', sortOrder - 1)
    .maybeSingle();
  if (!data) return null;
  if (data.lat && data.lng) return { lat: Number(data.lat), lng: Number(data.lng) };
  if (!data.municipality_code) return null;
  const m = (await fetchMunicipalities([data.municipality_code])).get(data.municipality_code);
  return m ? { lat: Number(m.latitude), lng: Number(m.longitude) } : null;
}

/** 2地点間の大円距離(km)。道のりではないので実際よりやや短く出る。 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  if (!a.lat || !a.lng || !b.lat || !b.lng) return 0;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * 区間の移動手段を保存する。transports は「到着地点(to_log_id)」で区間を表すので、
 * その行を更新し、無ければ作る。distance_km は既存値を壊さないよう触らない。
 */
export async function setLegTransport(tripId: string, toLogId: string, mode: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await supabase
    .from('transports')
    .update({ mode })
    .eq('trip_id', tripId)
    .eq('to_log_id', toLogId)
    .select('to_log_id');
  if (error) return false;
  if (data && data.length) return true;
  const { error: insErr } = await supabase
    .from('transports')
    .insert({ trip_id: tripId, to_log_id: toLogId, mode, distance_km: 0 });
  return !insErr;
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

/**
 * いいねとコメントの取得。
 * ここは絶対に throw しない。1つでも失敗すると画面側の state が null のままになり、
 * 「投稿できているのに一生表示されない」状態に陥るため、
 * 取れたものだけを返して残りは空で埋める。
 */
export async function fetchStepSocial(logId: string): Promise<StepSocial> {
  const uid = await currentUserId();

  let reactions: any[] = [];
  try {
    const r = await supabase
      .from('reactions').select('user_id').eq('target_type', 'log').eq('target_id', logId);
    reactions = r.data ?? [];
  } catch {}

  // FK を明示する。notification_reads 経由で comments↔profiles の経路が2つできてしまい、
  // 単に profiles(...) と書くと PostgREST が PGRST201 で必ず失敗する。
  let comments: any[] = [];
  try {
    const withAuthor = await supabase
      .from('comments')
      .select('id, body, created_at, author_id, profiles!comments_author_id_fkey(display_name)')
      .eq('log_id', logId).order('created_at', { ascending: true });
    if (withAuthor.error) {
      // 埋め込みが何かの理由で通らなくても、本文だけは必ず出す
      const plain = await supabase
        .from('comments')
        .select('id, body, created_at, author_id')
        .eq('log_id', logId).order('created_at', { ascending: true });
      comments = plain.data ?? [];
    } else {
      comments = withAuthor.data ?? [];
    }
  } catch {}

  return {
    likes: reactions.length,
    likedByMe: !!uid && reactions.some((r: any) => r.user_id === uid),
    comments: comments.map((c: any) => ({
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

/**
 * コメントを投稿し、作られた行をそのまま返す。
 * 再取得の成否に画面表示を依存させないため、insert の戻り値を使う。
 * 失敗時は null（呼び出し側でエラー表示）。
 */
export async function addComment(logId: string, tripId: string, body: string): Promise<StepComment | null> {
  const uid = await currentUserId();
  if (!uid || !body.trim()) return null;
  const { data, error } = await supabase
    .from('comments')
    .insert({ trip_id: tripId, log_id: logId, author_id: uid, body: body.trim() })
    .select('id, body, created_at')
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    author: '',            // 表示名は呼び出し側が持っている
    body: data.body,
    createdAt: (data.created_at ?? '').slice(0, 10),
  };
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
      // ここも FK を明示（notification_reads があるため曖昧になる）
      .select('id, body, created_at, author_id, log_id, trip_id, profiles!comments_author_id_fkey(display_name)')
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
  // 自分が当事者の行だけを明示的に引く。RLS任せの無条件selectだと、
  // ポリシーが自分以外の行も返す環境で「相手」の計算が壊れ、
  // 実際の友だちが一覧に出なくなる（user_a を誤って相手扱いする）
  const { data } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`);
  const otherIds = Array.from(
    new Set(
      (data ?? [])
        .map((f: any) => (f.user_a === uid ? f.user_b : f.user_a))
        .filter((x: string) => x && x !== uid)
    )
  );
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
/**
 * その人のプロフィールに出す旅。**持ち主の旅と、バディーとして
 * 参加した旅の両方。** 持ち主だけに絞ると、友だちの旅に写真を
 * 足している人（trip_members の editor）のプロフィールが
 * 「0 trips」になる（iino_matcha が「日本縦断」のバディーなのに
 * 空だった）。見える範囲は今までどおり RLS が決める ――
 * 公開の旅と、自分に見せられている旅しか返らない。
 */
export async function fetchTripsByOwner(ownerId: string): Promise<Trip[]> {
  const [{ data: owned }, { data: memberOf }] = await Promise.all([
    supabase.from('trips').select(TRIP_COLS).eq('owner_id', ownerId),
    supabase.from('trip_members').select('trip_id').eq('user_id', ownerId),
  ]);
  const extraIds = (memberOf ?? [])
    .map((r: any) => r.trip_id)
    .filter((tid: string) => !(owned ?? []).some((t: any) => t.id === tid));
  const { data: joined } = extraIds.length
    ? await supabase.from('trips').select(TRIP_COLS).in('id', extraIds)
    : { data: [] as any[] };
  const all = [...(owned ?? []), ...(joined ?? [])].sort((a: any, b: any) =>
    String(b.start_date ?? '').localeCompare(String(a.start_date ?? ''))
  );
  if (!all.length) return [];
  return assembleTrips(all);
}

/** 友達（または本人）の訪問都道府県コード。RPCがRLS相当の判定を行う。 */
export async function fetchVisitedPrefecturesOf(userId: string): Promise<number[]> {
  const { data, error } = await supabase.rpc('visited_prefectures_of', { p_user: userId });
  if (error || !data) return [];
  return (data as any[]).map((r) => (typeof r === 'number' ? r : r.visited_prefectures_of)).filter((n) => n != null);
}

// ---------------------------------------------------------------- tourism areas (Explore)
export interface TourismArea {
  id: string;
  name: string;
  nameJa: string;
  municipality: string;
  prefectureCode: number | null;
  areaType: string;
  matchaUrl: string | null;
}

/**
 * MATCHAの記事（県カードのアプリ内ポップアップ用、0027）。
 * body は本文の抜粋で、段落は空行(\n\n)区切り。全文は持たない ――
 * 続きはMATCHAで読ませる。
 */
export interface MatchaArticle {
  id: string;
  url: string;
  title: string;
  body: string;
  images: string[];
  prefectureCode: number;
  publishedAt: string | null;
  /**
   * 本文の出典。MATCHAの本文をそのまま使っているときは null。
   * 一覧・季節ものの記事は、その場所の概要（Wikipedia）に差し替えている
   */
  textAttribution: string | null;
  textAttributionUrl: string | null;
  /**
   * その記事が扱っている行き先の名前（「若松城」「三春滝桜」）。
   * 県のカードの「◯◯県で行くなら」の段はこれを見出しにする ―― 題を出すと
   * 「福島市の気温は？年間平均と…」のような行き先でないものが並ぶため。
   * 取り込みのときに決まらなかった記事は null
   */
  place: string | null;
}

/**
 * その県の記事を表示言語で引く。無ければ日本語 → 英語の順で拾う
 * （取り込みが言語ごとに進むため、欠けた言語で空にしない）。
 */
export async function fetchMatchaArticles(prefectureCode: number, lang: string): Promise<MatchaArticle[]> {
  if (!isSupabaseConfigured) {
    return mockMatchaArticles.filter((a) => a.prefectureCode === prefectureCode);
  }
  const pull = async (l: string) => {
    const { data } = await supabase
      .from('matcha_articles')
      .select('id, url, title, body, images, prefecture_code, published_at, place, text_attribution, text_attribution_url')
      .eq('prefecture_code', prefectureCode)
      .eq('lang', l)
      .order('published_at', { ascending: false })
      .limit(6);
    return (data ?? []).map((a: any) => ({
      id: a.id,
      url: a.url,
      title: a.title,
      /**
       * 改行を LF に揃える。
       * 段落は空行区切りで持っており、読む側は `\n\n` で切る。
       * **SQL Editor に貼って入れると CRLF になる**（実際に81件すべてが
       * `\r\n\r\n` で入り、段落が1つに潰れて写真も1枚しか出なかった）。
       * 入れ方に左右されないよう、読むときに正す
       */
      body: String(a.body ?? '').replace(/\r\n?/g, '\n'),
      images: Array.isArray(a.images) ? a.images.filter((u: unknown) => typeof u === 'string') : [],
      prefectureCode: a.prefecture_code,
      publishedAt: a.published_at ?? null,
      place: a.place ?? null,
      textAttribution: a.text_attribution ?? null,
      textAttributionUrl: a.text_attribution_url ?? null,
    })) as MatchaArticle[];
  };
  for (const l of Array.from(new Set([lang, 'ja', 'en']))) {
    const rows = await pull(l);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * 県の紹介文。
 *
 * **DBを先に見て、行が無いときだけ手元の文にさがる。**
 * 文は消したり書き足したりできるように prefecture_texts へ移したが、
 * 取り込み前や通信が細いときに県のカードが空になると困るので、
 * lib/quiz/descriptions.ts の文を控えとして残してある。
 *
 * 一度引いたら覚えておく（県のカードは開くたびに同じ文を引く）。
 */
const prefTextCache = new Map<string, string>();

export async function fetchPrefectureText(
  prefectureCode: number,
  lang: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const key = `${prefectureCode}:${lang}`;
  const hit = prefTextCache.get(key);
  if (hit !== undefined) return hit;
  const { data } = await supabase
    .from('prefecture_texts')
    .select('lang, body')
    .eq('prefecture_code', prefectureCode)
    .in('lang', Array.from(new Set([lang, 'ja', 'en'])));
  const rows = data ?? [];
  // 表示言語 → 日本語 → 英語 の順で拾う（取り込みが言語ごとに進むため）
  for (const l of Array.from(new Set([lang, 'ja', 'en']))) {
    const row = rows.find((r: any) => r.lang === l);
    if (row?.body) {
      prefTextCache.set(key, row.body);
      return row.body;
    }
  }
  return null;
}

/** 観光エリアも表示言語で見せる。無ければ英語、それも無ければ日本語 */
const AREA_NAME_COL: Record<string, { name: string; muni: string }> = {
  en: { name: 'name_en', muni: 'municipality_en' },
  ja: { name: 'name_ja', muni: 'municipality_ja' },
  ko: { name: 'name_ko', muni: 'municipality_ko' },
  'zh-Hans': { name: 'name_zh_hans', muni: 'municipality_zh_hans' },
  'zh-Hant': { name: 'name_zh_hant', muni: 'municipality_zh_hant' },
};

function toArea(a: any): TourismArea {
  const col = AREA_NAME_COL[getLocale()] ?? AREA_NAME_COL.en;
  return {
    id: a.tourism_area_id,
    name: a[col.name] || a.name_en || a.name_ja,
    nameJa: a.name_ja ?? '',
    municipality: a[col.muni] || a.municipality_en || '',
    prefectureCode: a.prefecture_code ?? null,
    areaType: a.area_type ?? '',
    matchaUrl: a.matcha_url ?? null,
  };
}

const AREA_COLS =
  'tourism_area_id, name_en, name_ja, name_ko, name_zh_hans, name_zh_hant,' +
  ' municipality_en, municipality_ja, municipality_ko, municipality_zh_hans,' +
  ' municipality_zh_hant, prefecture_code, area_type, matcha_url';

/**
 * Explore の検索: 観光エリア（tourism_area_master）を名前・市区町村で検索。
 * 「東京」「Tokyo」のような都道府県名なら、その県のエリアを一覧で返す。
 */
export async function searchTourismAreas(q: string): Promise<TourismArea[]> {
  if (!isSupabaseConfigured) return [];
  const term = q.trim();
  if (!term) return [];

  const prefCode = prefectureCodeForQuery(term);
  if (prefCode) {
    const { data } = await supabase
      .from('tourism_area_master')
      .select(AREA_COLS)
      .eq('prefecture_code', prefCode)
      .order('name_en')
      .limit(40);
    return (data ?? []).map(toArea);
  }

  const like = `%${term}%`;
  const { data } = await supabase
    .from('tourism_area_master')
    .select(AREA_COLS)
    .or(`name_en.ilike.${like},name_ja.ilike.${like},municipality_en.ilike.${like}`)
    .limit(40);
  return (data ?? []).map(toArea);
}

/** Explore の Trending spots: 実際のチェックイン数で並べた観光エリア。 */
export async function fetchTrendingAreas(limit = 12): Promise<TourismArea[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('trending_tourism_areas', { p_limit: limit });
  if (error || !data) return [];
  return (data as any[]).map(toArea);
}

/** 検索していないときに見せる一覧（全200件のうち先頭から）。 */
export async function fetchTourismAreas(limit = 40): Promise<TourismArea[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('tourism_area_master').select(AREA_COLS).limit(limit);
  return (data ?? []).map(toArea);
}

// ------------------------------------------------- sponsored cards (0030)
/**
 * Exploreの「注目の旅」に混ぜるスポンサーカード。
 * 旅カードと同じ見た目で出し、題の下に displayName を置いて出所を示す。
 * 管理は /admin/sponsors。書き込みは superadmin のみ（RLSで縛っている）。
 */
export interface SponsoredCard {
  id: string;
  /** 社内向けの会社名。画面には出さない */
  company: string;
  /** 題の下に出すサービス名/ブランド名 */
  displayName: string;
  title: string;
  url: string;
  imageUrl: string;
  active: boolean;
  position: number;
}

const SPONSORED_COLS = 'id, company, display_name, title, url, image_url, active, position';

function toSponsoredCard(r: any): SponsoredCard {
  return {
    id: r.id,
    company: r.company,
    displayName: r.display_name,
    title: r.title,
    url: r.url,
    imageUrl: r.image_url,
    active: !!r.active,
    position: r.position ?? 0,
  };
}

/** 表示中のカードを position 順で。未ログインでも読める（RLS: active のみ）。 */
export async function fetchSponsoredCards(): Promise<SponsoredCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('sponsored_cards')
    .select(SPONSORED_COLS)
    .eq('active', true)
    .order('position', { ascending: true });
  if (error || !data) return [];
  return data.map(toSponsoredCard);
}

/** 管理用: 非表示も含めた全件。superadmin 以外には active な行しか返らない。 */
export async function fetchAllSponsoredCards(): Promise<SponsoredCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('sponsored_cards')
    .select(SPONSORED_COLS)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []).map(toSponsoredCard);
}

/** 管理用: 追加（idなし）または更新（idあり）。superadmin 以外はRLSで弾かれる。 */
export async function saveSponsoredCard(input: {
  id?: string;
  company: string;
  displayName: string;
  title: string;
  url: string;
  imageUrl: string;
  active: boolean;
  position: number;
}): Promise<boolean> {
  const row = {
    company: input.company,
    display_name: input.displayName,
    title: input.title,
    url: input.url,
    image_url: input.imageUrl,
    active: input.active,
    position: input.position,
  };
  const { error, count } = input.id
    ? await supabase.from('sponsored_cards').update(row, { count: 'exact' }).eq('id', input.id)
    : await supabase.from('sponsored_cards').insert(row, { count: 'exact' });
  // RLSに弾かれた update はエラーにならず0件更新になるので、件数まで見る
  return !error && (count ?? 0) > 0;
}

/**
 * スポンサーカードの画像を上げて、そのまま貼れる公開URLを返す。
 *
 * 写真と同じ 'photos' バケットの `<自分のuid>/sponsors/` に置く。
 * バケットを分けないのは、既にあるポリシー（先頭が自分のuid）でそのまま
 * 通るのと、公開URLの作り方を1本に保てるため。
 *
 * **必ず縮めてから送る。** カードの背景なので写真より大きめの 1600px で
 * 揃える（推奨は 1600×1000px 以上・16:10）。縮められなかった大きい画像は
 * 送らずに null を返す ―― 原寸をそのまま送ると回線の細い場所で必ず失敗する。
 */
export async function uploadSponsorImage(file: Blob): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const compressed = await compressImage(file, 1600, 0.82);
  if (!compressed) return null;
  const rand = Math.random().toString(36).slice(2, 9);
  const path = `${uid}/sponsors/${Date.now()}-${rand}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
  if (error) return null;
  return publicUrl(path);
}

export async function deleteSponsoredCard(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('sponsored_cards')
    .delete({ count: 'exact' })
    .eq('id', id);
  return !error && (count ?? 0) > 0;
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

/**
 * 注文の状態を進める（管理者のみ）。
 * paid にはできない ―― 入金の確定は Stripe の webhook だけが通す道。
 */
export async function setOrderStatus(
  orderId: string,
  status: 'printing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
  tracking?: string,
  note?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_set_order_status', {
    p_order: orderId,
    p_status: status,
    p_tracking: tracking ?? '',
    p_note: note ?? '',
  });
  return !error && data === true;
}

/** 自分のユーザー名。管理画面で「自分の権限は変えられない」を出すのに使う。 */
export async function fetchMyUsername(): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data } = await supabase.from('profiles').select('username').eq('id', uid).maybeSingle();
  return data?.username ?? null;
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

/** 管理者の付け外しの結果。画面はこれを見て日本語の一言を出す。 */
export type AdminRoleResult = 'ok' | 'not_found' | 'forbidden' | 'self' | 'bad_role' | 'failed';

/**
 * 管理者を付ける/外す（0032 の admin_set_role）。
 *
 * 真偽値だけだと「いない利用者」なのか「権限が足りない」のか言い分けられず、
 * 画面が「できませんでした」としか言えなくなるので、理由まで受け取る。
 * 0032 を貼る前の環境では関数が無いので、0007 の set_admin_role に落として
 * 理由はこちらで推測する（利用者の有無は profiles を引けば分かる）。
 */
export async function setAdminRoleDetailed(username: string, role: string | null): Promise<AdminRoleResult> {
  const name = username.trim().replace(/^@/, '');
  if (!name) return 'not_found';
  const { data, error } = await supabase.rpc('admin_set_role', { p_username: name, p_role: role ?? '' });
  if (!error && data && typeof data === 'object') {
    return (data as any).ok ? 'ok' : (((data as any).reason as AdminRoleResult) ?? 'failed');
  }
  // 関数が無い（=0032 未適用）ときだけ古い道へ。それ以外の失敗はそのまま返す
  const missing = !!error && /function|does not exist|schema cache|PGRST202/i.test(`${error.code ?? ''} ${error.message ?? ''}`);
  if (!missing) return 'failed';

  const { data: who } = await supabase.from('profiles').select('id').eq('username', name).maybeSingle();
  if (!who) return 'not_found';
  if (who.id === (await currentUserId())) return 'self';
  const ok = await setAdminRole(name, role);
  return ok ? 'ok' : 'forbidden';
}

/** いまログインしている人のメールアドレス（自分の行に「自分」と出すのに使う） */
export async function fetchMyEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email?.toLowerCase() ?? null;
}

/** 管理者の1人。メールアドレスは auth.users にしか無いので関数から受け取る */
export interface AdminPerson {
  username: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
}

/**
 * 管理者の一覧（メールアドレス付き・0033 の admin_list_admins）。
 * auth.users はクライアントから読めないので、関数に束ねてもらう。
 * 0033 を貼る前は profiles だけの一覧に落ちる（メールは空）。
 */
export async function fetchAdminPeople(): Promise<AdminPerson[]> {
  const { data, error } = await supabase.rpc('admin_list_admins');
  if (!error && Array.isArray(data)) {
    return data.map((a: any) => ({
      username: a.username ?? '',
      name: a.name ?? a.username ?? '',
      email: a.email ?? '',
      role: a.role ?? '',
      isOwner: !!a.is_owner,
    }));
  }
  const old = await fetchAdmins();
  return old.map((a) => ({ ...a, email: '', isOwner: false }));
}

/** 付け外しの結果。owner = 持ち主の全権は外せない */
export type AdminEmailResult = AdminRoleResult | 'owner';

/**
 * メールアドレスで管理者を付ける/外す（0033）。
 * 運営が把握しているのはたいていメールの方なので、こちらを主の入口にする。
 */
export async function setAdminRoleByEmail(email: string, role: string | null): Promise<AdminEmailResult> {
  const addr = email.trim().toLowerCase();
  if (!addr) return 'not_found';
  const { data, error } = await supabase.rpc('admin_set_role_by_email', { p_email: addr, p_role: role ?? '' });
  if (!error && data && typeof data === 'object') {
    return (data as any).ok ? 'ok' : (((data as any).reason as AdminEmailResult) ?? 'failed');
  }
  return 'failed';
}

/** 分析データ（都道府県 / 市区町村 / 滞在 / 移動手段）。管理者のみ。 */
export async function fetchAnalytics(): Promise<{
  prefecture: any | null;
  municipality: any | null;
  stay: any | null;
  transport: any[] | null;
  /** 県別の移動手段（0032）。全国のまとめは画面から外した */
  transportByPrefecture: any[] | null;
}> {
  const [p, m, s, t, tp] = await Promise.all([
    supabase.rpc('admin_prefecture_stats'),
    supabase.rpc('admin_municipality_stats'),
    supabase.rpc('admin_stay_stats'),
    supabase.rpc('admin_transport_stats'),
    supabase.rpc('admin_transport_by_prefecture'),
  ]);
  return {
    prefecture: p.error ? null : p.data,
    municipality: m.error ? null : m.data,
    stay: s.error ? null : s.data,
    transport: t.error ? null : (t.data as any[]),
    transportByPrefecture: tp.error ? null : (tp.data as any[]),
  };
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

// ---------------------------------------------------------------- 既存写真の編集
export interface StoredPhoto { id: string; path: string; url: string }

/** その地点に既に付いている写真。編集画面で消せるように id ごと返す。 */
export async function fetchStepPhotos(logId: string): Promise<StoredPhoto[]> {
  if (!isSupabaseConfigured || !logId) return [];
  const { data } = await supabase
    .from('photos')
    .select('id, storage_path, sort_order')
    .eq('log_id', logId)
    .order('sort_order', { ascending: true });
  return (data ?? []).map((p: any) => ({ id: p.id, path: p.storage_path, url: publicUrl(p.storage_path) }));
}

/**
 * 写真を消す。行を消してから実体も消す。
 * 実体の削除に失敗しても行は戻さない（画面から消えたものが残り続ける方が困る）。
 */
export async function deleteStepPhotos(photos: StoredPhoto[]): Promise<boolean> {
  if (!photos.length) return true;
  const { error } = await supabase.from('photos').delete().in('id', photos.map((p) => p.id));
  if (error) return false;
  const paths = photos.map((p) => p.path).filter((p) => p && !/^https?:\/\//.test(p));
  if (paths.length) {
    try { await supabase.storage.from(PHOTO_BUCKET).remove(paths); } catch {}
  }
  bump('trips');
  return true;
}

// ---------------------------------------------------------------- 写真から旅を起こす
export interface NearestPlace {
  municipalityCode: number;
  prefectureCode: number;
  municipalityEn: string;
  prefectureEn: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

/**
 * 座標から一番近い市区町村。日本国外の座標は null。
 * 外部のジオコーダは使わず、手元の municipalities_master(1,741件) から引く。
 */
/** 市区町村引きが「国外」ではなく**引けなかった**とき（RPC失敗・マスタが読めない）。 */
export class PlaceLookupError extends Error {}

export async function nearestMunicipality(lat: number, lng: number): Promise<NearestPlace | null> {
  const { data, error } = await supabase.rpc('nearest_municipality', { p_lat: lat, p_lng: lng });
  // RPCの失敗を「日本の外」と混ぜない。混ぜると、通信やRLSの不調のたびに
  // 「日本国内の場所として読み取れませんでした」と嘘の理由を出してしまう
  if (error) throw new PlaceLookupError(error.message);
  if (!data || !data.length) {
    // 日本の外接矩形の中の座標なら、必ずどこかの市区町村が2度以内に居る。
    // それでも0行なのは国外ではなくデータが引けていない
    // （municipalities_master が読めない等）。実際にRLSでこれが起きた
    if (isJapanCoord(lat, lng)) {
      throw new PlaceLookupError('nearest_municipality returned no rows for a coordinate inside Japan');
    }
    return null;
  }
  const r = data[0];
  // 日本の外の座標でも矩形にかすれば行が返る。遠すぎるものは「日本ではない」と扱う
  if (Number(r.distance_km) > 60) return null;
  return {
    municipalityCode: Number(r.municipality_code),
    prefectureCode: Number(r.prefecture_code),
    municipalityEn: r.municipality_en ?? '',
    prefectureEn: r.prefecture_en ?? '',
    lat: Number(r.latitude),
    lng: Number(r.longitude),
    distanceKm: Number(r.distance_km),
  };
}

// ---------------------------------------------------------------- 製本の購入
/**
 * かご → 決済 → 完了。
 *
 * かごへ入れるときに、その本の全ページを画像として Storage へ焼く。
 * 旅はあとから編集できるので、注文したものと届くものがずれないよう、
 * 注文の中身は「そのときのページ画像の列」で固定する。
 */
export type BookPlanKey = 'premium' | 'regular';

export const PLAN_PRICE: Record<BookPlanKey, number> = { premium: 8500, regular: 3900 };

/**
 * お届けエリア。送料は距離ではなくエリアで決まる。
 * 日本は東アジアに含む。金額の正はサーバ側 shipping_fee_for()。
 */
export type ShippingRegion = 'east-asia' | 'southeast-asia' | 'west' | 'other';

export const SHIPPING_REGIONS: ShippingRegion[] = ['east-asia', 'southeast-asia', 'west', 'other'];

const SHIPPING_FEE: Record<ShippingRegion, number> = {
  'east-asia': 1000,
  'southeast-asia': 1300,
  west: 2200,
  other: 2500,
};

/** 1kgを超えた分、1kgごとに乗る追加料金。金額の正はサーバ側 shipping_fee_for()。 */
const SHIPPING_STEP: Record<ShippingRegion, number> = {
  'east-asia': 600,
  'southeast-asia': 800,
  west: 1400,
  other: 1600,
};

/** 製本仕様ごとの1冊あたり重量(g)。サーバ側 book_weight_g() の写し。 */
export const BOOK_WEIGHT_G: Record<BookPlanKey, number> = { premium: 720, regular: 420 };

/** 封筒と緩衝材。実重量に完全一致はしないので、一律で足しておく。 */
export const PACKAGING_G = 200;

/**
 * 送料。お届けエリアと総重量で決まる。
 * 最初の1kgまでが基本料金、そこから1kgごとに段階的に上がる。
 * 表示のためにここでも計算するが、請求額の正はサーバ側 shipping_fee_for()。
 */
export function shippingFeeFor(region: ShippingRegion, weightG = 0): number {
  const base = SHIPPING_FEE[region] ?? SHIPPING_FEE.other;
  const step = SHIPPING_STEP[region] ?? SHIPPING_STEP.other;
  const over = Math.max(0, weightG + PACKAGING_G - 1000);
  return base + step * Math.ceil(over / 1000);
}

/** かごの中身の総重量(g)。梱包材は含まない。 */
export function cartWeightG(items: Array<{ plan: BookPlanKey; qty: number }>): number {
  return items.reduce((g, i) => g + BOOK_WEIGHT_G[i.plan] * i.qty, 0);
}

export interface CartItem {
  id: string;
  tripId: string;
  plan: BookPlanKey;
  title: string;
  coverPhotoUrl: string | null;
  pageCount: number;
  photoCount: number;
  pageUrls: string[];
  unitPrice: number;
  /** 部数。unitPrice は1冊あたりのまま。 */
  qty: number;
}

function toCartItem(r: any): CartItem {
  return {
    id: r.id,
    tripId: r.trip_id,
    plan: r.plan,
    title: r.title,
    coverPhotoUrl: r.cover_photo_url ?? null,
    pageCount: r.page_count ?? 0,
    photoCount: r.photo_count ?? 0,
    pageUrls: Array.isArray(r.page_urls) ? r.page_urls : [],
    unitPrice: r.unit_price_jpy ?? 0,
    qty: r.qty ?? 1,
  };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * ページ画像を1枚アップロードして公開URLを返す。
 * 写真と違って縮小はしない（そのまま印刷に回る解像度で入っている）。
 * パスは決め打ちなので、同じ旅・同じ仕様で入れ直すと上書きされる。
 */
async function uploadBookPage(uid: string, tripId: string, plan: BookPlanKey, index: number, blob: Blob): Promise<string> {
  const path = `${uid}/books/${tripId}-${plan}/p${String(index).padStart(3, '0')}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  return publicUrl(path);
}

/**
 * かごへ入れる。全ページを焼いてから1件だけ書く。
 * 途中で失敗したら何も入れない（半端な注文をDBに残さない）。
 * onProgress は「何枚目まで焼けたか」。
 */
export async function addToCart(input: {
  tripId: string;
  plan: BookPlanKey;
  title: string;
  coverPhotoUrl?: string | null;
  photoCount?: number;
  /** i ページ目の画像（data URL）を返す。null なら白紙として扱う。 */
  renderPage: (i: number) => Promise<string | null>;
  pageCount: number;
  onProgress?: (done: number, total: number) => void;
}): Promise<CartItem | null> {
  const uid = await currentUserId();
  if (!uid) return null;

  const pageUrls: string[] = [];
  for (let i = 0; i < input.pageCount; i++) {
    const dataUrl = await input.renderPage(i);
    if (dataUrl) pageUrls.push(await uploadBookPage(uid, input.tripId, input.plan, i, await dataUrlToBlob(dataUrl)));
    input.onProgress?.(i + 1, input.pageCount);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      {
        user_id: uid,
        trip_id: input.tripId,
        plan: input.plan,
        title: input.title,
        cover_photo_url: input.coverPhotoUrl ?? pageUrls[0] ?? null,
        page_count: input.pageCount,
        photo_count: input.photoCount ?? 0,
        page_urls: pageUrls,
        unit_price_jpy: PLAN_PRICE[input.plan],
      },
      { onConflict: 'user_id,trip_id,plan' }
    )
    .select('*')
    .single();
  if (error || !data) return null;
  bump('cart');
  return toCartItem(data);
}

export async function fetchCart(): Promise<CartItem[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  const { data } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: true });
  return (data ?? []).map(toCartItem);
}

/** 部数を変える。1未満・20超は受け付けない（DB側にも同じ制約がある）。 */
export async function setCartQty(id: string, qty: number): Promise<boolean> {
  const n = Math.max(1, Math.min(20, Math.round(qty)));
  const { error } = await supabase.from('cart_items').update({ qty: n }).eq('id', id);
  if (!error) bump('cart');
  return !error;
}

export async function removeCartItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  if (!error) bump('cart');
  return !error;
}

export interface ShippingInput {
  email: string;
  name: string;
  region: ShippingRegion;
  postalCode: string;
  address1: string;
  address2?: string;
  phone?: string;
}

/** かごを注文へ移す。返るのは注文ID（この時点ではまだ未払い）。 */
export async function checkoutCart(input: ShippingInput): Promise<string | null> {
  const { data, error } = await supabase.rpc('checkout_cart', {
    p_email: input.email.trim(),
    p_name: input.name.trim(),
    p_region: input.region,
    p_address: {
      postal_code: input.postalCode.trim(),
      address1: input.address1.trim(),
      address2: (input.address2 ?? '').trim(),
      phone: (input.phone ?? '').trim(),
    },
  });
  if (error) throw new Error(error.message);
  bump('cart');
  return (data as string) ?? null;
}

/** 決済完了。ここを通ったときだけ paid になり、/admin へ通知が積まれる。 */
export async function markOrderPaid(orderId: string, paymentIntent?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('mark_order_paid', {
    p_order: orderId,
    p_payment_intent: paymentIntent ?? null,
  });
  if (!error) bump('orders');
  return !error && data === true;
}

export interface OrderItemRow {
  id: string;
  tripId: string | null;
  plan: string;
  title: string;
  coverPhotoUrl: string | null;
  pageCount: number;
  unitPrice: number;
}

export interface OrderRow {
  id: string;
  status: string;
  amount: number;
  subtotal: number;
  shippingFee: number;
  region: ShippingRegion;
  createdAt: string;
  paidAt: string | null;
  items: OrderItemRow[];
}

export async function fetchMyOrders(): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('my_orders');
  if (error || !data) return [];
  return (data as any[]).map((o) => ({
    id: o.id,
    status: o.status,
    amount: o.amount_jpy ?? 0,
    subtotal: o.subtotal_jpy ?? 0,
    shippingFee: o.shipping_fee_jpy ?? 0,
    region: (o.shipping_region ?? 'other') as ShippingRegion,
    createdAt: o.created_at,
    paidAt: o.paid_at ?? null,
    items: (o.items ?? []).map((i: any) => ({
      id: i.id,
      tripId: i.trip_id ?? null,
      plan: i.plan,
      title: i.title,
      coverPhotoUrl: i.cover_photo_url ?? null,
      pageCount: i.page_count ?? 0,
      unitPrice: i.unit_price_jpy ?? 0,
      qty: i.qty ?? 1,
    })),
  }));
}

export interface AdminNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
}

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase.rpc('admin_notifications_list', { p_limit: 50 });
  if (error || !data) return [];
  return (data as any[]).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body ?? null,
    orderId: n.order_id ?? null,
    readAt: n.read_at ?? null,
    createdAt: n.created_at,
  }));
}

export async function markAdminNotificationsRead(id?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_notifications_mark_read', { p_id: id ?? null });
  return !error && data === true;
}

/** 記録→カウント→ユーザー：訪問済み都道府県コード(1..47)。RPC my_visited_prefectures を使用。 */
export async function fetchVisitedPrefectureCodes(): Promise<number[]> {
  const { data, error } = await supabase.rpc('my_visited_prefectures');
  if (error || !data) return [];
  return (data as any[]).map((r) => (typeof r === 'number' ? r : r.my_visited_prefectures)).filter((n) => n != null);
}

/**
 * 注文を Stripe の支払いページへ渡す。返るのはそのページのURL。
 * 金額は渡さない。注文IDだけ渡し、サーバがDBの金額で組み立てる。
 */
export async function createStripeCheckout(orderId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const origin = typeof window === 'undefined' ? undefined : window.location.origin;
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { orderId, origin },
  });
  if (error || !data?.url) return null;
  return data.url as string;
}
