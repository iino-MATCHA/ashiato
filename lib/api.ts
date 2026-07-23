/**
 * Supabase データアクセス層。
 * DBスキーマ（supabase/migrations/0001,0002）を app の型（lib/mock の Trip/Step/Goshuin）へマップする。
 * Supabase 未設定時は呼び出し側でモックにフォールバックする（lib/useData 参照）。
 *
 * 前提テーブル: trips, logs(=steps), photos, transports, prefectures,
 *              user_goshuin, goshuin_masters, trip_members, profiles
 * 画像は Storage バケット 'photos' の storage_path を公開URL化して使う。
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

/** 1つの旅を、logs(=steps)・photos・transports・prefectures を結合して組み立てる。 */
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
      .select('id, title, note, place_name, lat, lng, logged_at, sort_order, prefecture_id, prefectures(name)')
      .eq('trip_id', id)
      .order('sort_order', { ascending: true }),
    supabase.from('transports').select('to_log_id, mode, distance_km').eq('trip_id', id),
    supabase.from('trip_members').select('user_id, profiles(display_name)').eq('trip_id', id),
  ]);

  const logIds = (logs ?? []).map((l: any) => l.id);
  const { data: photos } = logIds.length
    ? await supabase.from('photos').select('log_id, storage_path, sort_order').in('log_id', logIds).order('sort_order', { ascending: true })
    : { data: [] as any[] };

  const photosByLog = new Map<string, string[]>();
  (photos ?? []).forEach((p: any) => {
    const arr = photosByLog.get(p.log_id) ?? [];
    arr.push(publicUrl(p.storage_path));
    photosByLog.set(p.log_id, arr);
  });
  const transportByTo = new Map<string, string>();
  (transports ?? []).forEach((t: any) => transportByTo.set(t.to_log_id, t.mode));

  const steps: Step[] = (logs ?? []).map((l: any) => ({
    id: l.id,
    title: l.title ?? l.place_name ?? 'Untitled',
    placeName: l.place_name ?? '',
    prefectureName: l.prefectures?.name ?? '',
    note: l.note ?? '',
    loggedAt: (l.logged_at ?? '').slice(0, 10),
    lng: Number(l.lng) || 0,
    lat: Number(l.lat) || 0,
    images: photosByLog.get(l.id) ?? [],
    transport: toTransport(transportByTo.get(l.id)),
  }));

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

/** ログイン中ユーザーが閲覧可能な旅の一覧（RLSに従う）。 */
export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id')
    .order('start_date', { ascending: false });
  if (error || !data) return [];
  const trips = await Promise.all(data.map((t: any) => fetchTrip(t.id)));
  return trips.filter(Boolean) as Trip[];
}

/** 47都道府県分の御朱印（マスタ）＋自分の獲得状況。 */
export async function fetchGoshuin(): Promise<Goshuin[]> {
  const [{ data: masters }, { data: mine }] = await Promise.all([
    supabase
      .from('goshuin_masters')
      .select('id, name, rarity, prefecture_id, prefectures(name)')
      .eq('is_active', true),
    supabase.from('user_goshuin').select('goshuin_master_id, acquired_at'),
  ]);
  const acquiredMap = new Map<string, string>();
  (mine ?? []).forEach((g: any) => acquiredMap.set(g.goshuin_master_id, g.acquired_at));

  return (masters ?? []).map((m: any) => ({
    id: m.id,
    prefectureId: m.prefecture_id,
    prefectureName: m.prefectures?.name ?? '',
    name: m.name,
    rarity: m.rarity,
    acquired: acquiredMap.has(m.id),
    acquiredAt: acquiredMap.get(m.id)?.slice(0, 10),
    kanji: (m.name ?? '·').slice(0, 1),
  }));
}
