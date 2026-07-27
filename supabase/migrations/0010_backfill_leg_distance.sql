-- =====================================================================
-- 足跡 (Ashiato) — 0010: 区間距離(distance_km)の穴埋め
-- =====================================================================
-- createStep が distance_km = 0 のまま transports を作っていたため、
-- 旅の総距離が常に 0 km になり、管理画面の平均移動距離も 0 だった。
-- 既存の行を、前後の地点の座標から大円距離で埋める。
-- 座標は logs に無ければ municipalities_master から引く。
-- =====================================================================

with coords as (
  select l.id, l.trip_id, l.sort_order,
         coalesce(l.lat, m.latitude)  as lat,
         coalesce(l.lng, m.longitude) as lng
  from logs l
  left join municipalities_master m on m.municipality_code = l.municipality_code
),
legs as (
  select b.id as to_log_id, b.trip_id,
         -- 大円距離 (km)
         2 * 6371 * asin(least(1, sqrt(
             sin(radians(b.lat - a.lat) / 2) ^ 2
           + cos(radians(a.lat)) * cos(radians(b.lat))
           * sin(radians(b.lng - a.lng) / 2) ^ 2
         ))) as km
  from coords a
  join coords b on b.trip_id = a.trip_id and b.sort_order = a.sort_order + 1
  where a.lat is not null and a.lng is not null
    and b.lat is not null and b.lng is not null
)
update transports t
set distance_km = round(legs.km::numeric, 1)
from legs
where legs.to_log_id = t.to_log_id
  and coalesce(t.distance_km, 0) = 0;
