-- 招待リンクで、ログインせずにその旅を見られるようにする。
--
-- リンクを受け取った人は、まだアカウントを持っていない。
-- ログインを先に求めると、何に誘われたのか分からないまま登録することになる。
-- 先に中身を見せて、写真を足したくなった時点で登録してもらう。
--
-- 合鍵は旅ごとの invite_token。持っている人だけが読める。
-- 通信のヘッダ x-invite-token に載せてもらい、RLS がそれを照合する
-- （PostgREST は request.headers で全ヘッダを見られる）。
-- これなら読み取りの問い合わせを一切書き換えずに済む。

alter table trips add column if not exists invite_token uuid not null default gen_random_uuid();
create unique index if not exists trips_invite_token_key on trips (invite_token);

-- ヘッダの合鍵。無ければ空文字を返す
create or replace function invite_token_of_request()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(current_setting('request.headers', true)::json ->> 'x-invite-token', ''),
    ''
  )::uuid
$$;

-- 合鍵が指している旅
create or replace function invited_trip_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id from trips t where t.invite_token = invite_token_of_request()
$$;

-- ---------------------------------------------------------------- 読み取り

drop policy if exists trips_invited_read on trips;
create policy trips_invited_read on trips
  for select using (id = invited_trip_id());

drop policy if exists logs_invited_read on logs;
create policy logs_invited_read on logs
  for select using (trip_id = invited_trip_id());

drop policy if exists photos_invited_read on photos;
create policy photos_invited_read on photos
  for select using (trip_id = invited_trip_id());

drop policy if exists transports_invited_read on transports;
create policy transports_invited_read on transports
  for select using (trip_id = invited_trip_id());

drop policy if exists trip_members_invited_read on trip_members;
create policy trip_members_invited_read on trip_members
  for select using (trip_id = invited_trip_id());

-- 旅の持ち主と同行者の名前だけは見せる。誰の旅なのか分からないと読めない
drop policy if exists profiles_invited_read on profiles;
create policy profiles_invited_read on profiles
  for select using (
    exists (select 1 from trips t where t.id = invited_trip_id() and t.owner_id = profiles.id)
    or exists (select 1 from trip_members m where m.trip_id = invited_trip_id() and m.user_id = profiles.id)
  );

-- ---------------------------------------------------------------- 参加

/**
 * 合鍵を持っている人を、その旅のバディーとして入れる。
 * 登録を終えた直後に呼ぶ。すでに入っていれば何もしない。
 * 戻り値は旅のid（画面をそのまま続けるために使う）。
 */
create or replace function trip_join_by_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select id into v_trip from trips where invite_token = p_token;
  if v_trip is null then
    return null;
  end if;

  -- 書ける立場で入れる。招かれた人は写真を足すために来ている
  insert into trip_members (trip_id, user_id, role)
  values (v_trip, auth.uid(), 'editor')
  on conflict (trip_id, user_id) do nothing;

  return v_trip;
end;
$$;

revoke all on function trip_join_by_invite(uuid) from public;
grant execute on function trip_join_by_invite(uuid) to authenticated;

/** 合鍵から旅のidを引く。リンクを開いた時点ではidを知らないため */
create or replace function trip_id_by_invite(p_token uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from trips where invite_token = p_token
$$;

grant execute on function trip_id_by_invite(uuid) to anon, authenticated;
grant execute on function invite_token_of_request() to anon, authenticated;
grant execute on function invited_trip_id() to anon, authenticated;
