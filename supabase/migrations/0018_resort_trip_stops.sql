-- =====================================================================
-- My Japan — 0018: 旅の立ち寄り先を時系列に並べ直す
-- =====================================================================
-- 立ち寄り先は sort_order で並ぶが、追加は常に末尾なので、あとから古い日付の
-- 立ち寄り先を足すと並びが崩れる（写真から足す導線でも、手入力でも同じ）。
--
-- ここで直すのは3つ。
--   1. sort_order を logged_at 順に振り直す
--   2. 区間(transports)は「到着地点」で表すので、並べ直すと前の地点が変わる。
--      距離を新しい並びで測り直す（移動手段は利用者が選んだものなので触らない）
--   3. 先頭になった地点は区間ではなくなるので、その行を落とす。
--      2番目以降で行が無いものは作る
--
-- 呼べるのは旅のメンバーだけ。
-- =====================================================================

-- 並び替えたあとの各区間の距離。到着地点(to_log_id)で区間を表す。
-- 座標は logs 自身に無ければ市区町村の代表点を使う。
create or replace function trip_legs(p_trip uuid)
returns table (to_log_id uuid, km integer)
language sql stable as $$
  with coords as (
    select l.id, l.sort_order,
           coalesce(l.lat, m.latitude)::double precision  as lat,
           coalesce(l.lng, m.longitude)::double precision as lng
    from logs l
    left join municipalities_master m on m.municipality_code = l.municipality_code
    where l.trip_id = p_trip
  )
  select b.id,
         round(6371 * 2 * asin(sqrt(
           power(sin(radians(b.lat - a.lat) / 2), 2) +
           cos(radians(a.lat)) * cos(radians(b.lat)) *
           power(sin(radians(b.lng - a.lng) / 2), 2)
         )))::integer
  from coords a
  join coords b on b.sort_order = a.sort_order + 1
  where a.lat is not null and a.lng is not null
    and b.lat is not null and b.lng is not null;
$$;

create or replace function resort_trip_stops(p_trip uuid)
returns integer language plpgsql security definer as $$
declare
  v_count integer;
begin
  if not is_trip_member(p_trip) then
    return 0;
  end if;

  -- 1) 日付順に振り直す。同じ日は元の並びを保つ（created_at で安定させる）
  with ordered as (
    select id, row_number() over (order by logged_at, created_at, id) - 1 as pos
    from logs where trip_id = p_trip
  )
  update logs l set sort_order = o.pos
  from ordered o where o.id = l.id and l.sort_order <> o.pos;

  select count(*) into v_count from logs where trip_id = p_trip;
  if v_count = 0 then
    return 0;
  end if;

  -- 2) 先頭は区間ではない
  delete from transports t
   where t.trip_id = p_trip
     and t.to_log_id in (select id from logs where trip_id = p_trip and sort_order = 0);

  -- 3) 区間が無いものは作る。移動手段は距離から推す
  --    （lib/autotrip の guessTransport と同じ境目。あとから /trip で直せる）
  insert into transports (trip_id, to_log_id, mode, distance_km)
  select p_trip, l.id,
         case
           when coalesce(g.km, 0) < 3 then 'walk'
           when g.km < 150            then 'train'
           when g.km < 600            then 'shinkansen'
           else                            'plane'
         end::transport_mode,
         coalesce(g.km, 0)
  from logs l
  left join trip_legs(p_trip) g on g.to_log_id = l.id
  where l.trip_id = p_trip and l.sort_order > 0
    and not exists (select 1 from transports t where t.to_log_id = l.id);

  -- 4) すでにある区間は距離だけ測り直す（移動手段は利用者のものなので触らない）
  update transports t
     set distance_km = g.km
    from trip_legs(p_trip) g
   where t.to_log_id = g.to_log_id and t.trip_id = p_trip;

  return v_count;
end;
$$;

comment on function resort_trip_stops is
  '旅の立ち寄り先を logged_at 順に並べ直し、区間の距離を測り直す。写真から立ち寄り先を足したあとに呼ぶ。';
