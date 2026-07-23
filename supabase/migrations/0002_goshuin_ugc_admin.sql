-- =====================================================================
-- 足跡 (Ashiato) — 0002: 御朱印コレクション / UGC生成 / 管理画面 / 共通トリガ
-- 「日本版Polarsteps」仕様に基づく拡張
-- =====================================================================
-- 方針転換:
--   * 0001時点の「GPS自動取得なし」方針は維持する。
--     常時バックグラウンドGPSトラッキングは実装せず、
--     ユーザーが Step 作成時に手動で都道府県/地点を選ぶ「手動チェックイン」
--     によって御朱印を獲得する（GeoFenceによる自動判定は行わない）。
--   * 0001 の TODO（updated_at 自動更新 / friend_request 承認 → friendships /
--     trip 作成 → owner を trip_members へ自動追加）もここで実装する。
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUM 型
-- ---------------------------------------------------------------------
create type goshuin_rarity  as enum ('normal', 'limited', 'seasonal', 'collab');
create type ugc_card_type   as enum ('route', 'goshuin', 'trip_summary');
create type ugc_aspect_ratio as enum ('1:1', '9:16');
create type report_target   as enum ('trip', 'log', 'photo', 'ugc_card', 'comment', 'profile');
create type report_status   as enum ('pending', 'reviewing', 'actioned', 'dismissed');
create type admin_role      as enum ('viewer', 'moderator', 'superadmin');

-- =====================================================================
-- 都道府県マスタ
-- =====================================================================
create table prefectures (
  id          smallint primary key,        -- 1-47（JIS X 0401順）
  code        text unique not null,        -- 'tokyo' 等のslug
  name        text not null,               -- 東京都
  name_kana   text,
  region      text not null                -- 関東 / 近畿 等（発見画面の絞り込み用）
);

-- =====================================================================
-- 御朱印マスタ（管理画面 #18 で登録）
-- =====================================================================
create table goshuin_masters (
  id          uuid primary key default gen_random_uuid(),
  prefecture_id smallint not null references prefectures (id),
  name        text not null,
  rarity      goshuin_rarity not null default 'normal',
  image_url   text not null,
  description text,
  available_from timestamptz,             -- 季節限定/コラボ版の公開期間
  available_to   timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_goshuin_masters_prefecture on goshuin_masters (prefecture_id) where is_active;

-- =====================================================================
-- ユーザーの御朱印コレクション
-- =====================================================================
-- MVP: チェックインしたStepの作成者(author_id)本人のみが獲得する。
-- 将来的に trip_members 全員へ付与する拡張は別途検討。
create table user_goshuin (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  goshuin_master_id uuid not null references goshuin_masters (id),
  trip_id     uuid references trips (id) on delete set null,
  log_id      uuid references logs (id) on delete set null,   -- 獲得の起点になったStep
  acquired_at timestamptz not null default now(),
  unique (user_id, goshuin_master_id)
);
create index idx_user_goshuin_user on user_goshuin (user_id);

-- logs に都道府県を紐付け（手動選択。ジオフェンス自動判定は行わない）
alter table logs add column prefecture_id smallint references prefectures (id);
create index idx_logs_prefecture on logs (prefecture_id) where prefecture_id is not null;

-- =====================================================================
-- UGC画像（軌跡カード / 御朱印カード のシェア用生成物）
-- =====================================================================
create table ugc_cards (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references trips (id) on delete cascade,
  created_by  uuid not null references profiles (id) on delete cascade,
  card_type   ugc_card_type not null,
  aspect_ratio ugc_aspect_ratio not null,
  template    text not null default 'default',
  payload     jsonb not null default '{}',   -- 表示項目選択・カラー等の生成パラメータ
  storage_path text,                          -- 生成済み画像（Supabase Storage）
  share_count integer not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_ugc_cards_trip on ugc_cards (trip_id);
create index idx_ugc_cards_creator on ugc_cards (created_by);

-- =====================================================================
-- 通報・モデレーション（管理画面 #19）
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

-- =====================================================================
-- 管理者権限（管理画面 #17-19 のアクセス制御）
-- =====================================================================
alter table profiles add column admin_role admin_role;
-- admin_role は service_role 経由でのみ更新可能（本人による自己昇格を防ぐため
-- profiles_update ポリシーは later で列制限に置き換える。0003で対応）

-- =====================================================================
-- 共通トリガ: updated_at 自動更新
-- =====================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
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

-- =====================================================================
-- 共通トリガ: 友達申請 承認 → friendships 生成
-- =====================================================================
create or replace function handle_friend_request_accepted()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into friendships (user_a, user_b)
    values (
      least(new.requester_id, new.addressee_id),
      greatest(new.requester_id, new.addressee_id)
    )
    on conflict do nothing;
    new.responded_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_friend_request_accepted
  before update on friend_requests
  for each row execute function handle_friend_request_accepted();

-- =====================================================================
-- 共通トリガ: 旅作成 → owner を trip_members に自動追加
-- =====================================================================
create or replace function handle_trip_created()
returns trigger language plpgsql security definer as $$
begin
  insert into trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger trg_trip_created
  after insert on trips
  for each row execute function handle_trip_created();

-- =====================================================================
-- RLS
-- =====================================================================
alter table prefectures     enable row level security;
alter table goshuin_masters enable row level security;
alter table user_goshuin    enable row level security;
alter table ugc_cards       enable row level security;
alter table reports         enable row level security;

-- マスタ系は全員が閲覧可（書き込みはservice_role/管理画面のみ＝RLS未定義=デフォルト拒否）
create policy prefectures_select on prefectures for select using (true);
create policy goshuin_masters_select on goshuin_masters for select using (is_active);

-- 自分の御朱印は本人のみ閲覧。書き込みはトリガ/service_role経由のみ。
create policy user_goshuin_select on user_goshuin for select using (user_id = auth.uid());

-- UGCカードは作成者本人がフル操作、閲覧は旅メンバーまたは公開設定の旅に紐づく場合
create policy ugc_cards_owner_all on ugc_cards for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy ugc_cards_trip_member_select on ugc_cards for select
  using (trip_id is not null and is_trip_member(trip_id));

-- 通報は本人のみ閲覧・作成。更新（審査）はservice_role/管理画面のみ。
create policy reports_reporter_select on reports for select using (reporter_id = auth.uid());
create policy reports_reporter_insert on reports for insert with check (reporter_id = auth.uid());

-- =====================================================================
-- 47都道府県マスタ投入
-- =====================================================================
insert into prefectures (id, code, name, region) values
  (1,'hokkaido','北海道','北海道'),(2,'aomori','青森県','東北'),(3,'iwate','岩手県','東北'),
  (4,'miyagi','宮城県','東北'),(5,'akita','秋田県','東北'),(6,'yamagata','山形県','東北'),
  (7,'fukushima','福島県','東北'),(8,'ibaraki','茨城県','関東'),(9,'tochigi','栃木県','関東'),
  (10,'gunma','群馬県','関東'),(11,'saitama','埼玉県','関東'),(12,'chiba','千葉県','関東'),
  (13,'tokyo','東京都','関東'),(14,'kanagawa','神奈川県','関東'),(15,'niigata','新潟県','中部'),
  (16,'toyama','富山県','中部'),(17,'ishikawa','石川県','中部'),(18,'fukui','福井県','中部'),
  (19,'yamanashi','山梨県','中部'),(20,'nagano','長野県','中部'),(21,'gifu','岐阜県','中部'),
  (22,'shizuoka','静岡県','中部'),(23,'aichi','愛知県','中部'),(24,'mie','三重県','近畿'),
  (25,'shiga','滋賀県','近畿'),(26,'kyoto','京都府','近畿'),(27,'osaka','大阪府','近畿'),
  (28,'hyogo','兵庫県','近畿'),(29,'nara','奈良県','近畿'),(30,'wakayama','和歌山県','近畿'),
  (31,'tottori','鳥取県','中国'),(32,'shimane','島根県','中国'),(33,'okayama','岡山県','中国'),
  (34,'hiroshima','広島県','中国'),(35,'yamaguchi','山口県','中国'),(36,'tokushima','徳島県','四国'),
  (37,'kagawa','香川県','四国'),(38,'ehime','愛媛県','四国'),(39,'kochi','高知県','四国'),
  (40,'fukuoka','福岡県','九州'),(41,'saga','佐賀県','九州'),(42,'nagasaki','長崎県','九州'),
  (43,'kumamoto','熊本県','九州'),(44,'oita','大分県','九州'),(45,'miyazaki','宮崎県','九州'),
  (46,'kagoshima','鹿児島県','九州'),(47,'okinawa','沖縄県','沖縄');
