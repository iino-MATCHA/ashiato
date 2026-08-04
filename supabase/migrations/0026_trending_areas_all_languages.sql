-- 人気のスポットが、表示言語を切り替えても英語のままだった。
--
-- マスタは5言語ぶんの名前を持っているのに、この関数は英語の列しか
-- 返していなかったため、画面側で選びようがなかった。全部返して、
-- どれを見せるかは画面（lib/api.ts の AREA_NAME_COL）に任せる。

create or replace function trending_tourism_areas(p_limit int default 12)
returns json
language sql
stable
security definer
set search_path = public
as $$
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
    select t.tourism_area_id,
           t.name_en, t.name_ja, t.name_ko, t.name_zh_hans, t.name_zh_hant,
           t.municipality_en, t.municipality_ja, t.municipality_ko,
           t.municipality_zh_hans, t.municipality_zh_hant,
           t.prefecture_code, t.area_type, t.matcha_url,
           coalesce(mv.visits, 0) as visits
    from tourism_area_master t
    left join muni_visits mv on mv.municipality_code = t.municipality_code
    left join pref_visits pv on pv.prefecture_code = t.prefecture_code
    order by coalesce(mv.visits, 0) desc, coalesce(pv.visits, 0) desc, t.name_en
    limit p_limit
  ) x;
$$;

grant execute on function trending_tourism_areas(int) to anon, authenticated;
