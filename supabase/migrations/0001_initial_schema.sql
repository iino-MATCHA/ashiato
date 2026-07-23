-- =====================================================================
-- 足跡 (Ashiato) — 0001 コアスキーマ（既存マスタ対応版）
-- =====================================================================
-- 前提: 既に以下のマスタが存在する（このファイルでは作らない）。
--   Prefecture_master(prefecture_code 1..47, prefecture_ja/en/...)
--   municipalities_master(municipality_code, prefecture_code,
--                         municipality_ja/en/..., latitude, longitude)
-- 方針:
--   * 地点(logs=Step)は municipalities_master を参照して座標を得る
--     （地図のピンは municipalities_master の latitude/longitude を使う）。
--   * マスタ側に一意制約が無くても失敗しないよう、マスタへの外部キーは張らず
--     コード(integer)＋インデックスで論理的に紐付ける。
--   * RLSを有効化し「旅のメンバー」または「友達」のみ閲覧・編集可。
--   * GPS常時取得はしない（Step作成時に市区町村を選ぶ手動チェックイン）。
-- SQL Editor にこのまま貼り付けて実行してください（未実行の前提）。
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------
create type trip_status     as enum ('planning','ongoing','completed','archived');
create type trip_visibility as enum ('private','friends','public');
create type member_role     as enum ('owner','editor','viewer');
create type friend_status   as enum ('pending','accepted','declined','blocked');
create type transport_mode  as enum ('walk','car','train','shinkansen','bus','plane','ferry','bike','other');
create type book_status     as enum ('draft','cover_done','rendering','ready','ordered');
create type order_status    as enum ('pending','paid','printing','shipped','delivered','cancelled','refunded');
create type gift_status     as enum ('created','sent','opened','redeemed');

-- =====================================================================
-- 人 (People)
-- =====================================================================
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table friend_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status       friend_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_request check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table friendships (
  user_a     uuid not null references profiles (id) on delete cascade,
  user_b     uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  constraint ordered_pair check (user_a < user_b)
);

-- =====================================================================
-- 旅 (Trips)
-- =====================================================================
create table trips (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  title       text not null,
  description text,
  cover_photo_url text,
  status      trip_status not null default 'planning',
  visibility  trip_visibility not null default 'friends',
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table trip_members (
  trip_id    uuid not null references trips (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  role       member_role not null default 'editor',
  invited_by uuid references profiles (id) on delete set null,
  joined_at  timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- =====================================================================
-- 記録 (Records)
-- =====================================================================
-- 地点=Step。市区町村を選ぶ手動チェックイン。座標は municipalities_master 参照。
-- lat/lng は任意の微調整用オーバーライド（無ければマスタ座標を使う）。
create table logs (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references trips (id) on delete cascade,
  author_id        uuid references profiles (id) on delete set null,
  title            text,
  note             text,
  municipality_code integer,     -- → municipalities_master.municipality_code（論理FK）
  prefecture_code   integer,     -- → Prefecture_master.prefecture_code（1..47・論理FK）
  lat              double precision,   -- 任意オーバーライド
  lng              double precision,   -- 任意オーバーライド
  logged_at        timestamptz not null default now(),
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table photos (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references logs (id) on delete cascade,
  trip_id     uuid not null references trips (id) on delete cascade,
  uploader_id uuid references profiles (id) on delete set null,
  storage_path text not null,       -- Storage バケット 'photos' 内のパス
  width       integer,
  height      integer,
  taken_at    timestamptz,          -- EXIF撮影日時（位置情報は保存しない）
  caption     text,
  sort_order  integer not null default 0,   -- 0 番目が地図ピンのアイコン
  created_at  timestamptz not null default now()
);

create table transports (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  from_log_id uuid references logs (id) on delete set null,
  to_log_id   uuid references logs (id) on delete set null,  -- この地点への移動手段
  mode        transport_mode not null,
  departed_at timestamptz,
  arrived_at  timestamptz,
  distance_km double precision,
  note        text,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- 成果物 (Output)
-- =====================================================================
create table books (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  created_by  uuid references profiles (id) on delete set null,
  title       text not null,
  cover_photo_url text,
  status      book_status not null default 'draft',
  layout      jsonb not null default '{}',
  page_count  integer,
  preview_pdf_url text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table orders (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references books (id) on delete restrict,
  buyer_id    uuid not null references profiles (id) on delete restrict,
  status      order_status not null default 'pending',
  amount_jpy  integer not null,
  stripe_payment_intent text,
  shipping_address jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table gifts (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders (id) on delete set null,
  book_id     uuid not null references books (id) on delete cascade,
  sender_id   uuid not null references profiles (id) on delete cascade,
  recipient_id uuid references profiles (id) on delete set null,
  recipient_name  text,
  recipient_email text,
  shipping_address jsonb,
  message     text,
  status      gift_status not null default 'created',
  created_at  timestamptz not null default now(),
  opened_at   timestamptz
);

-- =====================================================================
-- SNS
-- =====================================================================
create table comments (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  log_id     uuid references logs (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table reactions (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  target_type text not null,          -- 'log' | 'photo' | 'trip'
  target_id   uuid not null,
  user_id     uuid not null references profiles (id) on delete cascade,
  emoji       text not null default '❤️',
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, user_id, emoji)
);

-- =====================================================================
-- インデックス
-- =====================================================================
create index idx_trip_members_user on trip_members (user_id);
create index idx_logs_trip          on logs (trip_id, sort_order);
create index idx_logs_municipality  on logs (municipality_code);
create index idx_logs_prefecture    on logs (prefecture_code);
create index idx_photos_log         on photos (log_id, sort_order);
create index idx_photos_trip        on photos (trip_id);
create index idx_transports_trip    on transports (trip_id);
create index idx_comments_trip      on comments (trip_id);
create index idx_reactions_target   on reactions (target_type, target_id);

-- =====================================================================
-- RLS ヘルパー
-- =====================================================================
create or replace function is_trip_member(p_trip uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from trip_members where trip_id = p_trip and user_id = auth.uid()
  );
$$;

create or replace function are_friends(p_other uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from friendships
    where user_a = least(auth.uid(), p_other) and user_b = greatest(auth.uid(), p_other)
  );
$$;

-- 記録→カウント→ユーザー紐付け：ログイン中ユーザーが訪れた都道府県コード一覧。
-- logs(市区町村) → municipalities_master(prefecture_code) を辿って distinct。
-- security invoker なので logs のRLS（=旅メンバーのみ可視）が効く。
create or replace function my_visited_prefectures()
returns setof integer language sql security invoker stable as $$
  select distinct coalesce(l.prefecture_code, m.prefecture_code)
  from logs l
  left join municipalities_master m on m.municipality_code = l.municipality_code
  where coalesce(l.prefecture_code, m.prefecture_code) is not null;
$$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table profiles        enable row level security;
alter table friend_requests enable row level security;
alter table friendships     enable row level security;
alter table trips           enable row level security;
alter table trip_members    enable row level security;
alter table logs            enable row level security;
alter table photos          enable row level security;
alter table transports      enable row level security;
alter table books           enable row level security;
alter table orders          enable row level security;
alter table gifts           enable row level security;
alter table comments        enable row level security;
alter table reactions       enable row level security;

create policy profiles_select on profiles for select using (true);
create policy profiles_update on profiles for update using (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());

create policy trips_select on trips for select using (
  visibility = 'public'
  or owner_id = auth.uid()
  or is_trip_member(id)
  or (visibility = 'friends' and are_friends(owner_id))
);
create policy trips_insert on trips for insert with check (owner_id = auth.uid());
create policy trips_modify on trips for update using (owner_id = auth.uid());
create policy trips_delete on trips for delete using (owner_id = auth.uid());

create policy logs_member_all on logs for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));
create policy photos_member_all on photos for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));
create policy transports_member_all on transports for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy trip_members_select on trip_members for select using (is_trip_member(trip_id));
create policy trip_members_insert on trip_members for insert with check (
  is_trip_member(trip_id) or exists (select 1 from trips where id = trip_id and owner_id = auth.uid())
);

create policy orders_owner on orders for all
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy gifts_party on gifts for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy comments_member on comments for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));
create policy reactions_member on reactions for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

-- 注: updated_at 自動更新 / 友達承認→friendships / 旅作成→owner追加 のトリガ、
--     および御朱印・UGC・通報は 0002 で追加。
