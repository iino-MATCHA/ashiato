-- =====================================================================
-- 足跡 (Ashiato) — 0003: ユーザーが「行ったことのある都道府県」を手動記録
-- =====================================================================
-- 初回ログイン時に、旅の記録が無くても訪問済み都道府県を登録できるようにする。
-- 訪問判定は「旅(logs)由来」＋「手動登録(user_prefectures)」の和集合。
-- 0001/0002 実行後に SQL Editor で実行してください。
-- =====================================================================

create table if not exists user_prefectures (
  user_id         uuid not null references profiles (id) on delete cascade,
  prefecture_code integer not null,        -- Prefecture_master.prefecture_code (1..47)
  created_at      timestamptz not null default now(),
  primary key (user_id, prefecture_code)
);

alter table user_prefectures enable row level security;
drop policy if exists user_prefectures_own on user_prefectures;
create policy user_prefectures_own on user_prefectures for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 訪問済み都道府県（旅由来 ∪ 手動登録）
create or replace function my_visited_prefectures()
returns setof integer language sql security invoker stable as $$
  select distinct prefecture_code from (
    select coalesce(l.prefecture_code, m.prefecture_code) as prefecture_code
    from logs l
    left join municipalities_master m on m.municipality_code = l.municipality_code
    union
    select up.prefecture_code
    from user_prefectures up
    where up.user_id = auth.uid()
  ) x
  where prefecture_code is not null;
$$;
