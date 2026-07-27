-- =====================================================================
-- 足跡 (Ashiato) — 0009: Explore の Trending spots をDBから引く
-- =====================================================================
-- 観光エリア(tourism_area_master)を、実際のチェックイン(logs)の多さで並べる。
-- 同じ市区町村のチェックイン数を第一キー、都道府県のチェックイン数を第二キーに
-- することで、データが少ない初期でも「東京の有名エリアが上に来る」並びになる。
-- security definer: logs は RLS がかかっているが、集計値だけを返すので安全。
-- =====================================================================

create or replace function trending_tourism_areas(p_limit integer default 12)
returns json language sql security definer stable as $$
  with muni_visits as (
    select municipality_code, count(*) as visits
    from logs
    where municipality_code is not null
    group by 1
  ),
  pref_visits as (
    select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code, count(*) as visits
    from logs l
    left join municipalities_master m on m.municipality_code = l.municipality_code
    group by 1
  )
  select coalesce(json_agg(x), '[]'::json) from (
    select t.tourism_area_id, t.name_en, t.name_ja, t.municipality_en,
           t.prefecture_code, t.area_type, t.matcha_url,
           coalesce(mv.visits, 0) as visits
    from tourism_area_master t
    left join muni_visits mv on mv.municipality_code = t.municipality_code
    left join pref_visits pv on pv.prefecture_code = t.prefecture_code
    order by coalesce(mv.visits, 0) desc,
             coalesce(pv.visits, 0) desc,
             t.tourism_area_id
    limit greatest(1, least(p_limit, 50))
  ) x;
$$;

grant execute on function trending_tourism_areas(integer) to anon, authenticated;
