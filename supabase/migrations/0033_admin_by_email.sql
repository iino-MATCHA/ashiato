-- =====================================================================
-- My Japan — 0033: 管理者はメールアドレスで扱う
-- =====================================================================
-- ・管理者の付け外しを**メールアドレス**でできるようにする
--   （ユーザー名は本人が変えられるうえ、運営が把握しているのは
--     たいていメールの方なので）
-- ・全権(superadmin)は iino@matcha-jp.com から来るものとする。
--   profiles の行が無くても・admin_role が消えていても、この住所で
--   ログインしていれば全権として扱う ―― 締め出されないための土台。
--
-- 何度貼り直しても壊れない（create or replace / if not exists）。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 持ち主のメールアドレス
-- ---------------------------------------------------------------------
-- 1か所に書いておき、下の判定と付け外しの両方から見る。
create or replace function owner_email()
returns text language sql immutable as $$
  select 'iino@matcha-jp.com'::text;
$$;

comment on function owner_email is
  'このアプリの持ち主。ここから全権が来る（0033）。移すときはこの関数だけ書き換える。';

/**
 * いまログインしている人のメールアドレス。
 * auth.users は普通の権限では読めないので security definer で読む。
 */
create or replace function my_email()
returns text language sql security definer stable set search_path = public, auth as $$
  select lower(u.email) from auth.users u where u.id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 2) 権限の判定に、持ち主のメールを足す
-- ---------------------------------------------------------------------
-- profiles.admin_role が正のままだが、持ち主だけは住所でも通す。
create or replace function is_superadmin()
returns boolean language sql security definer stable set search_path = public, auth as $$
  select
    coalesce((select p.admin_role::text = 'superadmin' from profiles p where p.id = auth.uid()), false)
    or my_email() = lower(owner_email());
$$;

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public, auth as $$
  select
    coalesce((select p.admin_role is not null from profiles p where p.id = auth.uid()), false)
    or my_email() = lower(owner_email());
$$;

-- 持ち主の profiles にも全権を書いておく（画面の一覧に出るように）。
-- まだ登録していなければ何も起きない。あとで登録すれば上の住所判定で通る。
update profiles p
   set admin_role = 'superadmin'
  from auth.users u
 where u.id = p.id
   and lower(u.email) = lower(owner_email())
   and (p.admin_role is distinct from 'superadmin'::admin_role);

-- ---------------------------------------------------------------------
-- 3) メールアドレスで付け外しする
-- ---------------------------------------------------------------------
-- 返す理由: forbidden / bad_role / not_found / self / owner
--   not_found … その住所の利用者が居ない（まだ登録していない）
--   self      … 自分自身は変えられない
--   owner     … 持ち主の全権は外せない
create or replace function admin_set_role_by_email(p_email text, p_role text)
returns json language plpgsql security definer set search_path = public, auth as $$
declare
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_role   text := nullif(btrim(coalesce(p_role, '')), '');
  v_target uuid;
begin
  if not is_superadmin() then
    return json_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_role is not null and v_role not in ('viewer', 'moderator', 'superadmin') then
    return json_build_object('ok', false, 'reason', 'bad_role');
  end if;
  if v_email = '' then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  select u.id into v_target from auth.users u where lower(u.email) = v_email;
  if v_target is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_target = auth.uid() then
    return json_build_object('ok', false, 'reason', 'self');
  end if;
  -- 持ち主の全権は外せない（外しても住所で通るので、嘘をつかない）
  if v_email = lower(owner_email()) and v_role is distinct from 'superadmin' then
    return json_build_object('ok', false, 'reason', 'owner');
  end if;

  -- profiles の行が無い人には付けられない（まだアプリを開いていない）
  if not exists (select 1 from profiles where id = v_target) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  update profiles set admin_role = v_role::admin_role where id = v_target;
  return json_build_object('ok', true, 'reason', 'ok');
end $$;

comment on function admin_set_role_by_email(text, text) is
  'メールアドレスで管理者を付け外しする。superadmin のみ。理由を json で返す（0033）。';

-- ---------------------------------------------------------------------
-- 4) 管理者の一覧（メールアドレス付き）
-- ---------------------------------------------------------------------
-- auth.users はクライアントから読めないので、ここで束ねて返す。
-- 管理者しか呼べない。
create or replace function admin_list_admins()
returns json language sql security definer stable set search_path = public, auth as $$
  select case when not is_admin() then null else (
    select coalesce(json_agg(x order by x.role_rank, x.email), '[]'::json) from (
      select
        p.username,
        coalesce(p.display_name, p.username) as name,
        lower(u.email) as email,
        p.admin_role::text as role,
        case p.admin_role::text
          when 'superadmin' then 0 when 'moderator' then 1 else 2 end as role_rank,
        (lower(u.email) = lower(owner_email())) as is_owner
      from profiles p
      join auth.users u on u.id = p.id
      where p.admin_role is not null
    ) x
  ) end;
$$;

comment on function admin_list_admins is
  '管理者の一覧。メールアドレスを含むので管理者だけが読める（0033）。';
