-- =====================================================================
-- 足跡 (Ashiato) — 初期スキーマ
-- 旅の記録 × クローズドSNS
-- Supabase / PostgreSQL
-- =====================================================================
-- 設計方針:
--   * Polarsteps との差別化＝「友達との密な共同編集」と「ギフト」。
--     よって trip_members（権限付き）と gifts を最初から一級市民にする。
--   * 全テーブルで Row Level Security を有効化し、
--     「旅のメンバー」または「友達」のみが閲覧・編集できるようにする。
--   * プライバシー方針: GPSによる位置情報の自動取得は行わない。
--     写真は本人が手動で投稿する。位置はユーザーが任意で地名/地点を選んだ場合のみ保持。
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM 型
-- ---------------------------------------------------------------------
create type trip_status     as enum ('planning', 'ongoing', 'completed', 'archived');
create type trip_visibility as enum ('private', 'friends', 'public');
create type member_role     as enum ('owner', 'editor', 'viewer');   -- 共同編集の権限
create type friend_status   as enum ('pending', 'accepted', 'declined', 'blocked');
create type transport_mode  as enum ('walk', 'car', 'train', 'bus', 'plane', 'ferry', 'bike', 'other');
create type book_status     as enum ('draft', 'cover_done', 'rendering', 'ready', 'ordered');
create type order_status     as enum ('pending', 'paid', 'printing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type gift_status     as enum ('created', 'sent', 'opened', 'redeemed');

-- =====================================================================
-- 人 (People)
-- =====================================================================

-- プロフィール（auth.users と 1:1）
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  display_name text not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 友達申請（送信→承認のフロー）
create table friend_requests (
  id          uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status      friend_status not null default 'pending',
  created_at  timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_request check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

-- 友達関係（双方向。承認時に正規化して1行保存）
-- user_a < user_b を常に満たすよう保存し、検索を単純化する。
create table friendships (
  user_a      uuid not null references profiles (id) on delete cascade,
  user_b      uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
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

-- 共同編集メンバー（★差別化の核）
create table trip_members (
  trip_id     uuid not null references trips (id) on delete cascade,
  user_id     uuid not null references profiles (id) on delete cascade,
  role        member_role not null default 'editor',
  invited_by  uuid references profiles (id) on delete set null,
  joined_at   timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- 訪問国（Add country / ステータス画面用）
create table trip_countries (
  trip_id      uuid not null references trips (id) on delete cascade,
  country_code text not null,            -- ISO 3166-1 alpha-2
  arrived_at   date,
  primary key (trip_id, country_code)
);

-- =====================================================================
-- 記録 (Records)
-- =====================================================================

-- ログ＝訪問地 / 日（地図上のピンになる単位）
-- lat/lng はGPS自動取得ではなく、ユーザーが地図で任意に地点を選んだ場合のみ入る。
create table logs (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete set null,
  title       text,
  note        text,
  place_name  text,                       -- 任意の手入力地名
  lat         double precision,           -- 任意。GPS自動取得はしない
  lng         double precision,           -- 任意。GPS自動取得はしない
  logged_at   timestamptz not null default now(),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 写真（ログにぶら下がる。本人が手動投稿。Supabase Storage の path を保持）
-- プライバシー方針により、写真の位置情報カラムは持たない。
create table photos (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references logs (id) on delete cascade,
  trip_id     uuid not null references trips (id) on delete cascade,  -- RLS高速化のため非正規化
  uploader_id uuid not null references profiles (id) on delete set null,
  storage_path text not null,
  width       integer,
  height      integer,
  taken_at    timestamptz,                -- 任意。EXIFの撮影日時（位置情報は保存しない）
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 移動区間（移動手段を入力する画面）
create table transports (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  from_log_id uuid references logs (id) on delete set null,
  to_log_id   uuid references logs (id) on delete set null,
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

-- 本（製本する写真集。表紙→レンダリング→購入）
create table books (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  created_by  uuid references profiles (id) on delete set null,
  title       text not null,
  cover_photo_url text,
  status      book_status not null default 'draft',
  layout      jsonb not null default '{}',-- ページ構成・選択写真
  page_count  integer,
  preview_pdf_url text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 購入（Stripe 決済）
create table orders (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references books (id) on delete restrict,
  buyer_id    uuid not null references profiles (id) on delete restrict,
  status      order_status not null default 'pending',
  amount_jpy  integer not null,
  stripe_payment_intent text,
  shipping_address jsonb,                  -- 配送先（自分用購入のとき）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ギフト（★差別化：作った本を友達/恋人/家族へ贈る）
-- 本(book)を贈る。アプリ未登録の相手にも、住所を入力して直接配送できる。
create table gifts (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders (id) on delete set null,
  book_id     uuid not null references books (id) on delete cascade,
  sender_id   uuid not null references profiles (id) on delete cascade,
  recipient_id uuid references profiles (id) on delete set null,   -- アプリ内ユーザーへ贈る場合
  recipient_name  text,                                            -- 未登録の相手の宛名
  recipient_email text,                                            -- 任意（通知用）
  shipping_address jsonb,                                          -- 未登録者へ直接配送する宛先
  message     text,
  status      gift_status not null default 'created',
  created_at  timestamptz not null default now(),
  opened_at   timestamptz
);

-- =====================================================================
-- SNS エンゲージメント
-- =====================================================================

create table comments (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  log_id      uuid references logs (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table reactions (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  target_type text not null,              -- 'log' | 'photo' | 'trip'
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
create index idx_logs_trip         on logs (trip_id, sort_order);
create index idx_photos_log        on photos (log_id, sort_order);
create index idx_photos_trip       on photos (trip_id);
create index idx_transports_trip   on transports (trip_id);
create index idx_comments_trip     on comments (trip_id);
create index idx_reactions_target  on reactions (target_type, target_id);

-- =====================================================================
-- RLS ヘルパー関数
-- =====================================================================

-- ログイン中ユーザーが指定の旅のメンバーか？
create or replace function is_trip_member(p_trip uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from trip_members
    where trip_id = p_trip and user_id = auth.uid()
  );
$$;

-- ログイン中ユーザーが指定ユーザーと友達か？
create or replace function are_friends(p_other uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from friendships
    where (user_a = least(auth.uid(), p_other)
       and user_b = greatest(auth.uid(), p_other))
  );
$$;

-- =====================================================================
-- RLS ポリシー（代表的なものを定義。残りは同パターンで拡張）
-- =====================================================================
alter table profiles        enable row level security;
alter table friend_requests enable row level security;
alter table friendships     enable row level security;
alter table trips           enable row level security;
alter table trip_members    enable row level security;
alter table trip_countries  enable row level security;
alter table logs            enable row level security;
alter table photos          enable row level security;
alter table transports      enable row level security;
alter table books           enable row level security;
alter table orders          enable row level security;
alter table gifts           enable row level security;
alter table comments        enable row level security;
alter table reactions       enable row level security;

-- profiles: 本人は全操作可、他人は閲覧のみ
create policy profiles_select on profiles for select using (true);
create policy profiles_update on profiles for update using (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());

-- trips: メンバー or 公開設定なら閲覧、owner は更新/削除
create policy trips_select on trips for select using (
  visibility = 'public'
  or owner_id = auth.uid()
  or is_trip_member(id)
  or (visibility = 'friends' and are_friends(owner_id))
);
create policy trips_insert on trips for insert with check (owner_id = auth.uid());
create policy trips_modify on trips for update using (owner_id = auth.uid());
create policy trips_delete on trips for delete using (owner_id = auth.uid());

-- logs / photos / transports: 旅メンバーなら読み書き可
create policy logs_member_all on logs for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));
create policy photos_member_all on photos for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));
create policy transports_member_all on transports for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

-- trip_members: 同じ旅のメンバーは一覧を見られる
create policy trip_members_select on trip_members for select using (is_trip_member(trip_id));

-- orders / gifts: 購入者・送り主・受取人のみ
create policy orders_owner on orders for all
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy gifts_party on gifts for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- 注: トリガ（updated_at 自動更新、friend_request 承認時の friendships 生成、
--     trip 作成時に owner を trip_members に自動追加 等）は 0002 で追加予定。
