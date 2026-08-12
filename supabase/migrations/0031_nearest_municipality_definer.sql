-- =====================================================================
-- My Japan — 0031: 写真→旅の市区町村引きが全員に0行を返していた問題
-- =====================================================================
-- 症状: 日本国内で撮ったGPS付きの写真でも「日本国内の場所として
--        読み取れませんでした」(not-japan) になる。
-- 原因: nearest_municipality(0015) は security invoker（呼び出し側の権限）で
--        municipalities_master を読むが、クライアントロール（anon /
--        authenticated）からはマスタが1行も読めない状態になっていた
--        （RLS有効・selectポリシー無し）。関数は空を返し、クライアントは
--        それを「日本の外」と解釈していた。
--        実測: nearest_municipality(35.6586, 139.7454)＝東京タワーが
--        anon でも authenticated でも [] を返す（2026-08-12 確認）。
-- 直し方:
--   1. マスタは秘匿情報ではないので、誰でも読めるselectポリシーを張る
--      （assembleTrips のフォールバック座標・チェックイン検索もこれで直る）
--   2. 関数自体も security definer にして、ポリシー事故に二度と巻き込まれ
--      ないようにする（返すのは公開マスタの行だけなので漏洩の心配は無い）
-- =====================================================================

-- ---- 1. マスタの読み取りを開ける --------------------------------------
alter table municipalities_master enable row level security;
drop policy if exists municipalities_master_read on municipalities_master;
create policy municipalities_master_read on municipalities_master
  for select using (true);
-- ポリシーではなく grant が剥がれていた場合にも効くよう、両方張る
grant select on municipalities_master to anon, authenticated;

alter table "Prefecture_master" enable row level security;
drop policy if exists prefecture_master_read on "Prefecture_master";
create policy prefecture_master_read on "Prefecture_master"
  for select using (true);
grant select on "Prefecture_master" to anon, authenticated;

-- ---- 2. 関数を definer に（定義は 0015 と同じ） ------------------------
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
language sql stable security definer set search_path = public as $$
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
  '緯度経度に最も近い市区町村。写真のEXIFから旅を起こすときに使う。日本国外の座標は行なしで返る。0031でsecurity definer化。';
