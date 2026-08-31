-- =====================================================================
-- My Japan — 0035: 持ち主（全権の出どころ）を複数のメールアドレスにする
-- =====================================================================
-- 0033 では持ち主が1人（iino@matcha-jp.com）だけだった。
-- 引き継ぎのあいだは**前任と後任の2人が同時に全権**でないと、
-- どちらかが締め出される。そこで住所を「1つ」から「並び」に広げる。
--
-- いまの持ち主:
--   iino@matcha-jp.com
--   takeda@matcha-jp.com
-- 増やす／減らすときは下の owner_emails() の配列だけを書き換える。
-- **最後の1人になっても消さない。** ここが空になると、profiles.admin_role が
-- 何かの拍子に消えたときに誰も管理画面へ入れなくなる。
--
-- このファイルは 0033 の関数をすべて置き換える（0033 を貼っていない環境でも
-- 単独で成立する）。何度貼り直しても壊れない。
-- 前提: profiles と admin_role 型（0002）があること。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 持ち主のメールアドレス（複数）
-- ---------------------------------------------------------------------
create or replace function owner_emails()
returns text[] language sql immutable as $$
  select array[
    'iino@matcha-jp.com',
    'takeda@matcha-jp.com'
  ]::text[];
$$;

comment on function owner_emails is
  'このアプリの持ち主たち。ここから全権が来る（0035）。増減はこの関数だけ書き換える。';

-- 0033 で入れた単数版。まだ呼んでいる箇所が残っていても動くように、
-- 先頭の1件を返す形で残す。**判定にはもう使わない。**
create or replace function owner_email()
returns text language sql immutable as $$
  select (owner_emails())[1];
$$;

comment on function owner_email is
  '互換用。0035 以降の判定は owner_emails() を見る。';

/** いま見ている人が持ち主かどうか。小文字に揃えて比べる。 */
create or replace function is_owner_email(p_email text)
returns boolean language sql immutable as $$
  select lower(btrim(coalesce(p_email, ''))) = any (
    select lower(e) from unnest(owner_emails()) as e
  );
$$;

/**
 * いまログインしている人のメールアドレス。
 * auth.users は普通の権限では読めないので security definer で読む。
 * （0033 と同じ。0033 を貼っていない環境のためにここでも定義する）
 */
create or replace function my_email()
returns text language sql security definer stable set search_path = public, auth as $$
  select lower(u.email) from auth.users u where u.id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 2) 権限の判定
-- ---------------------------------------------------------------------
-- profiles.admin_role が正のままだが、持ち主だけは住所でも通す。
create or replace function is_superadmin()
returns boolean language sql security definer stable set search_path = public, auth as $$
  select
    coalesce((select p.admin_role::text = 'superadmin' from profiles p where p.id = auth.uid()), false)
    or is_owner_email(my_email());
$$;

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public, auth as $$
  select
    coalesce((select p.admin_role is not null from profiles p where p.id = auth.uid()), false)
    or is_owner_email(my_email());
$$;

-- 持ち主の profiles にも全権を書いておく（画面の一覧に出るように）。
-- まだ登録していない人には何も起きない ―― あとで登録すれば上の住所判定で通る。
update profiles p
   set admin_role = 'superadmin'
  from auth.users u
 where u.id = p.id
   and is_owner_email(u.email)
   and (p.admin_role is distinct from 'superadmin'::admin_role);

-- ---------------------------------------------------------------------
-- 3) メールアドレスで付け外しする
-- ---------------------------------------------------------------------
-- 返す理由: forbidden / bad_role / not_found / self / owner
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
  if is_owner_email(v_email) and v_role is distinct from 'superadmin' then
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
  'メールアドレスで管理者を付け外しする。superadmin のみ。理由を json で返す（0035）。';

-- ---------------------------------------------------------------------
-- 4) 管理者の一覧（メールアドレス付き）
-- ---------------------------------------------------------------------
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
        is_owner_email(u.email) as is_owner
      from profiles p
      join auth.users u on u.id = p.id
      where p.admin_role is not null
    ) x
  ) end;
$$;

comment on function admin_list_admins is
  '管理者の一覧。メールアドレスを含むので管理者だけが読める（0035）。';
