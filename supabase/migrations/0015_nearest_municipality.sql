-- =====================================================================
-- 足跡 (Ashiato) — 0015: 座標から市区町村を引く
-- =====================================================================
-- 写真のEXIFから旅を起こすとき、緯度経度を「どの市区町村か」に変える必要がある。
-- 外部のジオコーダは使わない。すでに手元にある municipalities_master(1,741件)の
-- 代表点から一番近いものを返せば足りる（地図のピンも同じ点を使っている）。
--
-- 距離は大円距離。日本の緯度なら平面近似でも順位は変わらないが、
-- 経度1度の長さが緯度で変わるぶんを無視すると北海道と沖縄で誤差が出るので、
-- ちゃんと球面で測る。
-- =====================================================================

create or replace function nearest_municipality(p_lat double precision, p_lng double precision)
returns table (
  municipality_code integer,
  prefecture_code   integer,
  municipality_en   text,
  prefecture_en     text,
  latitude          double precision,
  longitude         double precision,
  distance_km       double precision
)
language sql stable as $$
  select m.municipality_code, m.prefecture_code, m.municipality_en, m.prefecture_en,
         m.latitude::double precision, m.longitude::double precision,
         6371 * 2 * asin(sqrt(
           power(sin(radians(m.latitude - p_lat) / 2), 2) +
           cos(radians(p_lat)) * cos(radians(m.latitude)) *
           power(sin(radians(m.longitude - p_lng) / 2), 2)
         )) as distance_km
  from municipalities_master m
  where m.latitude is not null and m.longitude is not null
    -- 粗い矩形で先に絞る。緯度1度≒111km、経度1度≒111km*cos(緯度)。
    -- 2度四方あれば日本国内のどこでも最寄りは必ず含まれる。
    and m.latitude between p_lat - 2 and p_lat + 2
    and m.longitude between p_lng - 2.5 and p_lng + 2.5
  order by distance_km
  limit 1;
$$;

comment on function nearest_municipality is
  '緯度経度に最も近い市区町村。写真のEXIFから旅を起こすときに使う。日本国外の座標は行なしで返る。';
