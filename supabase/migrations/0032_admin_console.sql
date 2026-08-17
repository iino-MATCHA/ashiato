-- =====================================================================
-- My Japan — 0032: 管理コンソール（インバウンド/国内の2分割・県別の移動手段・
--                  管理者の付け外し・スポンサー画像のアップロード）
-- =====================================================================
-- 何度貼っても同じ結果になるように書いてある（create or replace /
-- drop policy if exists → create policy）。上から順にそのまま貼ってよい。
--
-- 1) 出身の判定を1か所にまとめる（origin_segment）。
--    今まで「インバウンド比」は profiles.residence だけを見ていたので、
--    未記入の人が unknown として3本目の帯になっていた。
--    **インバウンドと国内のちょうど2つ**にしたいので、
--    residence が空のときは nationality で補い、それも無ければ国内に寄せる。
-- 2) 県別の移動手段（管理画面の全国集計をやめ、県のページに置くため）。
-- 3) 管理者の付け外しを画面から行うための RPC（理由を返す）。
-- 4) スポンサーカードの画像を Storage に上げるためのポリシー。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 出身の判定（インバウンド / 国内 の2つだけ）
-- ---------------------------------------------------------------------
-- residence('inbound'|'domestic') が正。空のときだけ nationality を見る。
-- どちらも無い人は「国内」に数える ―― 3本目の「不明」を作らないため。
-- 画面にもその旨を書いてある。
create or replace function origin_segment(p_residence text, p_nationality text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(p_residence, '')) = 'inbound'  then 'inbound'
    when lower(coalesce(p_residence, '')) = 'domestic' then 'domestic'
    when coalesce(p_nationality, '') <> '' and upper(p_nationality) <> 'JP' then 'inbound'
    else 'domestic'
  end;
$$;

comment on function origin_segment(text, text) is
  'インバウンドか国内かの2択。residence が正、無ければ nationality（JP以外=インバウンド）、それも無ければ国内。';

-- ---------------------------------------------------------------------
-- 2) 都道府県別の訪問（0008 の内容そのまま ＋ 国内/インバウンドの人数）
-- ---------------------------------------------------------------------
create or replace function admin_prefecture_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
    'by_prefecture', (
      select coalesce(json_agg(x), '[]'::json) from (
        select p.prefecture_code as code,
               count(*) as visits,
               count(distinct t.owner_id) as travellers,
               count(distinct case when origin_segment(pr.residence, pr.nationality) = 'inbound'
                                   then t.owner_id end) as inbound_travellers,
               count(distinct case when origin_segment(pr.residence, pr.nationality) = 'domestic'
                                   then t.owner_id end) as domestic_travellers
        from logs l
        join trips t on t.id = l.trip_id
        left join profiles pr on pr.id = t.owner_id
        left join municipalities_master m on m.municipality_code = l.municipality_code
        cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code) p
        where p.prefecture_code is not null
        group by 1 order by 2 desc
      ) x
    ),
    -- 県のページの「どこから来たか」もインバウンド/国内の2つに寄せる
    'by_origin', (
      select coalesce(json_agg(x), '[]'::json) from (
        select p.prefecture_code as code,
               origin_segment(pr.residence, pr.nationality) as segment,
               count(*) as visits,
               count(distinct t.owner_id) as travellers
        from logs l
        join trips t on t.id = l.trip_id
        left join profiles pr on pr.id = t.owner_id
        left join municipalities_master m on m.municipality_code = l.municipality_code
        cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code) p
        where p.prefecture_code is not null
        group by 1, 2 order by 1, 3 desc
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

-- ---------------------------------------------------------------------
-- 3) 滞在日数 ＋ インバウンド/国内（0008 の内容そのまま ＋ 2分割に変更）
-- ---------------------------------------------------------------------
-- 変更点は inbound_vs_domestic だけ。unknown の行が出ないようにした。
create or replace function admin_stay_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
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
    -- インバウンド VS 国内。**必ずこの2行だけ**返す（0件でも0で出す）。
    'inbound_vs_domestic', (
      select coalesce(json_agg(x order by x.segment), '[]'::json) from (
        select s.segment,
               count(distinct t.owner_id) as travellers,
               count(t.id) as trips,
               coalesce(round(avg(greatest(1, (coalesce(t.end_date, t.start_date) - t.start_date) + 1))::numeric, 1), 0) as avg_days
        from (values ('inbound'), ('domestic')) as s(segment)
        left join profiles pr on origin_segment(pr.residence, pr.nationality) = s.segment
        left join trips t on t.owner_id = pr.id
        group by 1
      ) x
    ),
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

-- ---------------------------------------------------------------------
-- 4) 県別の移動手段
-- ---------------------------------------------------------------------
-- 全国をまとめた「どうやって移動したか」は管理画面から外した。
-- 全国で見ても「電車が多い」以上のことは分からず、打ち手にならないため。
-- 到着した立ち寄り先（to_log_id）の県に数える ―― その移動でその県に入った、
-- と読むのが自然だから。to が無い区間だけ from で拾う。
create or replace function admin_transport_by_prefecture()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(x) from (
      select p.code, tr.mode::text as mode, count(*) as moves,
             coalesce(round(avg(nullif(tr.distance_km, 0))::numeric, 0), 0) as avg_km
      from transports tr
      left join logs l on l.id = coalesce(tr.to_log_id, tr.from_log_id)
      left join municipalities_master m on m.municipality_code = l.municipality_code
      cross join lateral (select coalesce(l.prefecture_code, m.prefecture_code) as code) p
      where p.code is not null
      group by 1, 2 order by 1, 3 desc
    ) x), '[]'::json) end;
$$;

-- ---------------------------------------------------------------------
-- 5) 管理者の付け外し（画面から行う）
-- ---------------------------------------------------------------------
-- 0007 の set_admin_role() は真偽値しか返さないので、
-- 「そんな利用者はいない」のか「権限が無い」のか画面で言い分けられない。
-- 理由まで返す RPC を足す（0007 の関数はそのまま残す）。
--
-- ・付け外しができるのは superadmin だけ
-- ・自分の権限は落とせない（最後の superadmin が消えて誰も入れなくなる事故を防ぐ）
-- ・role は admin_role 型の 'viewer' / 'moderator' / 'superadmin'。空文字は剥奪
create or replace function admin_set_role(p_username text, p_role text)
returns json language plpgsql security definer as $$
declare
  v_target uuid;
  v_role   text := nullif(btrim(coalesce(p_role, '')), '');
begin
  if not is_superadmin() then
    return json_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_role is not null and v_role not in ('viewer', 'moderator', 'superadmin') then
    return json_build_object('ok', false, 'reason', 'bad_role');
  end if;

  select id into v_target from profiles where username = btrim(p_username);
  if v_target is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_target = auth.uid() then
    return json_build_object('ok', false, 'reason', 'self');
  end if;

  update profiles set admin_role = v_role::admin_role where id = v_target;
  return json_build_object('ok', true, 'reason', 'ok');
end $$;

comment on function admin_set_role(text, text) is
  '管理者の付け外し。superadmin のみ。理由を json で返す（not_found / forbidden / self / bad_role）。';

-- ---------------------------------------------------------------------
-- 6) スポンサーカードの画像
-- ---------------------------------------------------------------------
-- 画像は写真と同じ 'photos' バケットの `<自分のuid>/sponsors/` に置く。
-- 写真アップロードと同じ形（先頭が自分のuid）なので、既にあるポリシーで
-- そのまま通るはず。通らない環境のために、明示のポリシーも張っておく。
-- storage.objects を触れない権限で貼られたときにここで全体が止まらないよう、
-- 失敗しても先へ進む形にしてある（その場合は Dashboard から張る）。
do $$
begin
  execute 'drop policy if exists photos_sponsor_insert on storage.objects';
  execute $p$
    create policy photos_sponsor_insert on storage.objects for insert to authenticated
    with check (
      bucket_id = 'photos'
      and (storage.foldername(name))[1] = auth.uid()::text
      and (storage.foldername(name))[2] = 'sponsors'
      and is_admin()
    )
  $p$;
exception when others then
  raise notice 'storage.objects のポリシーは張れませんでした（%）。既存の写真用ポリシーで足りていれば問題ありません。', sqlerrm;
end $$;
