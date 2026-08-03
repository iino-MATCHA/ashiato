-- 招待から入った人には、まだ profiles が無い。
--
-- profiles は普段オンボーディングの途中で作られるが、招待リンクの人は
-- そこを通らずに「写真を足す」から入ってくる。trip_members は profiles を
-- 参照しているので、無いまま入れようとして外部キーで落ちていた（実測）。
--
-- 参加のときに、無ければその場で作る。名前はメールの手前を使い、
-- 重なったら連番を足す（username に一意制約がある）。

create or replace function trip_join_by_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip  uuid;
  v_uid   uuid := auth.uid();
  v_email text;
  v_base  text;
  v_name  text;
  v_n     int := 0;
begin
  if v_uid is null then
    return null;
  end if;

  select id into v_trip from trips where invite_token = p_token;
  if v_trip is null then
    return null;
  end if;

  -- まだ名前を持っていなければ、ここで作る
  if not exists (select 1 from profiles where id = v_uid) then
    select email into v_email from auth.users where id = v_uid;
    v_base := nullif(regexp_replace(split_part(coalesce(v_email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), '');
    v_base := lower(left(coalesce(v_base, 'traveller'), 20));
    v_name := v_base;
    while exists (select 1 from profiles where username = v_name) loop
      v_n := v_n + 1;
      v_name := left(v_base, 16) || v_n::text;
    end loop;
    insert into profiles (id, username, display_name) values (v_uid, v_name, v_name);
  end if;

  -- 書ける立場で入れる。招かれた人は写真を足すために来ている
  insert into trip_members (trip_id, user_id, role)
  values (v_trip, v_uid, 'editor')
  on conflict (trip_id, user_id) do nothing;

  return v_trip;
end;
$$;

revoke all on function trip_join_by_invite(uuid) from public;
grant execute on function trip_join_by_invite(uuid) to authenticated;
