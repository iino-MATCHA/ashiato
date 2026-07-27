-- =====================================================================
-- 足跡 (Ashiato) — 0008: 観光エリアのMATCHAリンク ＋ 属性データ ＋ 分析RPC
-- =====================================================================
-- ④ Explore の検索対象を tourism_area_master にする。各エリアに
--    MATCHA の該当ページURLを持たせる。
--    MATCHA は /jp/list?region=<都道府県コード> を正しいエリアIDへ
--    リダイレクトしてくれるため、prefecture_code をそのまま使える。
-- admin ① 生年月日・国籍・居住区分を profiles に追加（分析の軸）。
-- admin ①〜⑦ 集計RPC。
-- =====================================================================

-- ---- 観光エリア: 都道府県コードとMATCHA URL ----
alter table tourism_area_master add column if not exists prefecture_code integer;
alter table tourism_area_master add column if not exists matcha_url text;

update tourism_area_master t
set prefecture_code = m.prefecture_code
from municipalities_master m
where m.municipality_code = t.municipality_code
  and (t.prefecture_code is null or t.prefecture_code <> m.prefecture_code);

update tourism_area_master
set matcha_url = 'https://matcha-jp.com/jp/list?region=' || prefecture_code || '&category=all'
where prefecture_code is not null;

-- 検索を速くする
create index if not exists idx_tourism_area_pref on tourism_area_master (prefecture_code);

-- 匿名でも観光エリアは読める（参照データ）
alter table tourism_area_master enable row level security;
drop policy if exists tourism_area_read on tourism_area_master;
create policy tourism_area_read on tourism_area_master for select using (true);

-- ---- 旅行者属性（分析の軸） ----
alter table profiles add column if not exists birth_date date;
alter table profiles add column if not exists nationality text;          -- ISO 3166-1 alpha-2 (JP, TW, US...)
alter table profiles add column if not exists residence text;            -- 'domestic' | 'inbound'

-- =====================================================================
-- 分析RPC（管理者のみ。すべて admin_ プレフィックス）
-- =====================================================================

-- ① 都道府県別の訪問（国籍・月の軸つき）
create or replace function admin_prefecture_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
    'by_prefecture', (
      select coalesce(json_agg(x), '[]'::json) from (
        select p.prefecture_code as code,
               count(*) as visits,
               count(distinct t.owner_id) as travellers,
               count(distinct case when pr.residence = 'inbound' then t.owner_id end) as inbound_travellers
        from logs l
        join trips t on t.id = l.trip_id
        left join profiles pr on pr.id = t.owner_id
        left join municipalities_master m on m.municipality_code = l.municipality_code
        cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code) p
        where p.prefecture_code is not null
        group by 1 order by 2 desc
      ) x
    ),
    'by_nationality', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(pr.nationality, 'unknown') as nationality,
               p.prefecture_code as code,
               count(*) as visits
        from logs l
        join trips t on t.id = l.trip_id
        left join profiles pr on pr.id = t.owner_id
        left join municipalities_master m on m.municipality_code = l.municipality_code
        cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code) p
        where p.prefecture_code is not null
        group by 1, 2 order by 3 desc limit 100
      ) x
    ),
    'by_month', (
      select coalesce(json_agg(x), '[]'::json) from (
        select extract(month from l.logged_at)::int as month,
               p.prefecture_code as code,
               count(*) as visits
        from logs l
        left join municipalities_master m on m.municipality_code = l.municipality_code
        cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code) p
        where p.prefecture_code is not null
        group by 1, 2 order by 1, 3 desc
      ) x
    ),
    -- 前後に訪問した都道府県のペア（回遊分析）
    'transitions', (
      select coalesce(json_agg(x), '[]'::json) from (
        with ordered as (
          select l.trip_id, l.sort_order,
                 coalesce(l.prefecture_code, m.prefecture_code) as code
          from logs l
          left join municipalities_master m on m.municipality_code = l.municipality_code
        )
        select a.code as from_code, b.code as to_code, count(*) as moves
        from ordered a
        join ordered b on b.trip_id = a.trip_id and b.sort_order = a.sort_order + 1
        where a.code is not null and b.code is not null and a.code <> b.code
        group by 1, 2 order by 3 desc limit 50
      ) x
    )
  ) end;
$$;

-- ② 市区町村別 ＋ ⑦ スポットマッピング（座標つき）
create or replace function admin_municipality_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
    'by_municipality', (
      select coalesce(json_agg(x), '[]'::json) from (
        select m.municipality_code as code, m.municipality_en as name,
               m.prefecture_code as pref, m.latitude as lat, m.longitude as lng,
               count(*) as visits
        from logs l
        join municipalities_master m on m.municipality_code = l.municipality_code
        group by 1,2,3,4,5 order by 6 desc limit 200
      ) x
    )
  ) end;
$$;

-- ③④ 滞在日数（都道府県別／全国・国籍別）＋ ⑤ インバウンドVS国内
create or replace function admin_stay_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
    -- 都道府県ごとの平均滞在日数（1つの旅の中で、その県のstopがある日の数）
    'stay_by_prefecture', (
      select coalesce(json_agg(x), '[]'::json) from (
        select code, round(avg(days)::numeric, 1) as avg_days, count(*) as trips
        from (
          select l.trip_id,
                 coalesce(l.prefecture_code, m.prefecture_code) as code,
                 count(distinct l.logged_at::date) as days
          from logs l
          left join municipalities_master m on m.municipality_code = l.municipality_code
          group by 1, 2
        ) per_trip
        where code is not null
        group by 1 order by 2 desc
      ) x
    ),
    -- 全国の平均（旅の日数・平均訪問都市数）
    'overall', (
      select json_build_object(
        'avg_trip_days', coalesce(round(avg(days)::numeric, 1), 0),
        'avg_cities', coalesce(round(avg(cities)::numeric, 1), 0),
        'trips', count(*)
      ) from (
        select t.id,
               greatest(1, (coalesce(t.end_date, t.start_date) - t.start_date) + 1) as days,
               (select count(distinct l.municipality_code) from logs l where l.trip_id = t.id) as cities
        from trips t where t.start_date is not null
      ) s
    ),
    -- 国籍別の平均
    'by_nationality', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(pr.nationality, 'unknown') as nationality,
               count(*) as trips,
               coalesce(round(avg(greatest(1, (coalesce(t.end_date, t.start_date) - t.start_date) + 1))::numeric, 1), 0) as avg_days,
               coalesce(round(avg((select count(distinct l.municipality_code) from logs l where l.trip_id = t.id))::numeric, 1), 0) as avg_cities
        from trips t
        left join profiles pr on pr.id = t.owner_id
        where t.start_date is not null
        group by 1 order by 2 desc
      ) x
    ),
    -- インバウンド VS 国内
    'inbound_vs_domestic', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(pr.residence, 'unknown') as segment,
               count(distinct t.owner_id) as travellers,
               count(*) as trips,
               coalesce(round(avg(greatest(1, (coalesce(t.end_date, t.start_date) - t.start_date) + 1))::numeric, 1), 0) as avg_days
        from trips t
        left join profiles pr on pr.id = t.owner_id
        group by 1 order by 3 desc
      ) x
    ),
    -- 年代別（生年月日から）
    'by_age_band', (
      select coalesce(json_agg(x), '[]'::json) from (
        select case
                 when birth_date is null then 'unknown'
                 when extract(year from age(birth_date)) < 20 then '<20'
                 when extract(year from age(birth_date)) < 30 then '20s'
                 when extract(year from age(birth_date)) < 40 then '30s'
                 when extract(year from age(birth_date)) < 50 then '40s'
                 when extract(year from age(birth_date)) < 60 then '50s'
                 else '60+' end as band,
               count(*) as users
        from profiles group by 1 order by 1
      ) x
    )
  ) end;
$$;

-- ⑥ 移動手段
create or replace function admin_transport_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(x) from (
      select mode::text as mode, count(*) as moves,
             coalesce(round(avg(nullif(distance_km, 0))::numeric, 0), 0) as avg_km
      from transports group by 1 order by 2 desc
    ) x), '[]'::json) end;
$$;
