-- =====================================================================
-- 足跡 (Ashiato) — 0007: 友達の訪問都道府県RPC ＋ 管理画面用RPC
-- =====================================================================
-- ③ 友達プロフィールで相手の御朱印数/制覇率が0になる問題:
--    user_prefectures は本人しか読めないため。友達なら読めるRPCを用意する。
-- 進展① /admin 用: is_admin() と、統計/注文/権限付与のRPC（security definer）。
-- =====================================================================

-- ---- 友達の訪問都道府県（本人 or 友達のみ） ----
create or replace function visited_prefectures_of(p_user uuid)
returns setof integer language sql security definer stable as $$
  select distinct prefecture_code from (
    select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code
    from logs l
    join trip_members tm on tm.trip_id = l.trip_id and tm.user_id = p_user
    left join municipalities_master m on m.municipality_code = l.municipality_code
    union
    select up.prefecture_code from user_prefectures up where up.user_id = p_user
  ) x
  where prefecture_code is not null
    and (p_user = auth.uid() or are_friends(p_user));
$$;

-- ---- 管理者判定 ----
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and admin_role is not null);
$$;

-- ---- 統計（管理者のみ。非管理者には null） ----
create or replace function admin_stats()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else json_build_object(
    'users',        (select count(*) from profiles),
    'trips',        (select count(*) from trips),
    'public_trips', (select count(*) from trips where visibility = 'public'),
    'stops',        (select count(*) from logs),
    'photos',       (select count(*) from photos),
    'comments',     (select count(*) from comments),
    'likes',        (select count(*) from reactions),
    'friendships',  (select count(*) from friendships),
    'top_prefectures', (
      select coalesce(json_agg(t), '[]'::json) from (
        select coalesce(l.prefecture_code, m.prefecture_code) as code, count(*) as visits
        from logs l
        left join municipalities_master m on m.municipality_code = l.municipality_code
        where coalesce(l.prefecture_code, m.prefecture_code) is not null
        group by 1 order by 2 desc limit 10
      ) t
    ),
    'recent_users', (
      select coalesce(json_agg(u), '[]'::json) from (
        select username, display_name, created_at::date::text as joined
        from profiles order by created_at desc limit 10
      ) u
    ),
    'recent_trips', (
      select coalesce(json_agg(t), '[]'::json) from (
        select tr.title, tr.visibility::text, p.username as owner, tr.created_at::date::text as created
        from trips tr left join profiles p on p.id = tr.owner_id
        order by tr.created_at desc limit 10
      ) t
    )
  ) end;
$$;

-- ---- 製本注文一覧（管理者のみ） ----
create or replace function admin_orders()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(o) from (
      select ord.id, ord.status::text, ord.amount_jpy,
             ord.created_at::date::text as ordered,
             b.title as book_title, p.username as buyer
      from orders ord
      left join books b on b.id = ord.book_id
      left join profiles p on p.id = ord.buyer_id
      order by ord.created_at desc limit 100
    ) o), '[]'::json) end;
$$;

-- ---- 管理者権限の付与/剥奪（管理者のみ実行可） ----
create or replace function set_admin_role(p_username text, p_role text)
returns boolean language plpgsql security definer as $$
begin
  if not is_admin() then
    return false;
  end if;
  if p_role is null or p_role = '' then
    update profiles set admin_role = null where username = p_username;
  else
    update profiles set admin_role = p_role::admin_role where username = p_username;
  end if;
  return found;
end $$;
