-- =====================================================================
-- 足跡 (Ashiato) — 0002 御朱印 / UGC / 通報 / 管理者 / トリガ（既存マスタ対応版）
-- =====================================================================
-- 0001 の後に SQL Editor で実行。
-- 都道府県は既存 Prefecture_master(prefecture_code 1..47) を参照する
-- （独自 prefectures テーブルは作らない）。マスタへの外部キーは張らず
-- prefecture_code(integer) で論理的に紐付ける。
-- =====================================================================

create type goshuin_rarity   as enum ('normal','limited','seasonal','collab');
create type ugc_card_type    as enum ('route','goshuin','trip_summary');
create type ugc_aspect_ratio as enum ('1:1','9:16');
create type report_target    as enum ('trip','log','photo','ugc_card','comment','profile');
create type report_status    as enum ('pending','reviewing','actioned','dismissed');
create type admin_role        as enum ('viewer','moderator','superadmin');

-- =====================================================================
-- 御朱印マスタ（管理画面で登録）— Prefecture_master を参照
-- =====================================================================
create table goshuin_masters (
  id              uuid primary key default gen_random_uuid(),
  prefecture_code integer not null,        -- → Prefecture_master.prefecture_code
  name            text not null,
  rarity          goshuin_rarity not null default 'normal',
  image_url       text not null,
  description     text,
  available_from  timestamptz,
  available_to    timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_goshuin_masters_pref on goshuin_masters (prefecture_code) where is_active;

-- ユーザーの御朱印コレクション
create table user_goshuin (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles (id) on delete cascade,
  goshuin_master_id uuid not null references goshuin_masters (id),
  trip_id           uuid references trips (id) on delete set null,
  log_id            uuid references logs (id) on delete set null,
  acquired_at       timestamptz not null default now(),
  unique (user_id, goshuin_master_id)
);
create index idx_user_goshuin_user on user_goshuin (user_id);

-- =====================================================================
-- UGCカード
-- =====================================================================
create table ugc_cards (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid references trips (id) on delete cascade,
  created_by   uuid not null references profiles (id) on delete cascade,
  card_type    ugc_card_type not null,
  aspect_ratio ugc_aspect_ratio not null,
  template     text not null default 'default',
  payload      jsonb not null default '{}',
  storage_path text,
  share_count  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index idx_ugc_cards_trip    on ugc_cards (trip_id);
create index idx_ugc_cards_creator on ugc_cards (created_by);

-- =====================================================================
-- 通報・モデレーション
-- =====================================================================
create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  target_type report_target not null,
  target_id   uuid not null,
  reason      text not null,
  status      report_status not null default 'pending',
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_reports_status on reports (status);

-- 管理者権限
alter table profiles add column admin_role admin_role;

-- =====================================================================
-- トリガ: updated_at 自動更新
-- =====================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_trips_updated_at before update on trips
  for each row execute function set_updated_at();
create trigger trg_logs_updated_at before update on logs
  for each row execute function set_updated_at();
create trigger trg_books_updated_at before update on books
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_goshuin_masters_updated_at before update on goshuin_masters
  for each row execute function set_updated_at();

-- トリガ: 友達申請 承認 → friendships 生成
create or replace function handle_friend_request_accepted()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into friendships (user_a, user_b)
    values (least(new.requester_id, new.addressee_id), greatest(new.requester_id, new.addressee_id))
    on conflict do nothing;
    new.responded_at = now();
  end if;
  return new;
end;
$$;
create trigger trg_friend_request_accepted before update on friend_requests
  for each row execute function handle_friend_request_accepted();

-- トリガ: 旅作成 → owner を trip_members に自動追加
create or replace function handle_trip_created()
returns trigger language plpgsql security definer as $$
begin
  insert into trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner') on conflict do nothing;
  return new;
end;
$$;
create trigger trg_trip_created after insert on trips
  for each row execute function handle_trip_created();

-- =====================================================================
-- RLS
-- =====================================================================
alter table goshuin_masters enable row level security;
alter table user_goshuin    enable row level security;
alter table ugc_cards       enable row level security;
alter table reports         enable row level security;

create policy goshuin_masters_select on goshuin_masters for select using (is_active);
create policy user_goshuin_select on user_goshuin for select using (user_id = auth.uid());

create policy ugc_cards_owner_all on ugc_cards for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy ugc_cards_trip_member_select on ugc_cards for select
  using (trip_id is not null and is_trip_member(trip_id));

create policy reports_reporter_select on reports for select using (reporter_id = auth.uid());
create policy reports_reporter_insert on reports for insert with check (reporter_id = auth.uid());
