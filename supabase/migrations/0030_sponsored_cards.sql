-- =====================================================================
-- My Japan — 0030: スポンサーカード
-- =====================================================================
-- /explore の「注目の旅」の並びに混ぜて出すスポンサー/アフィリエイトの
-- カード。周りの旅カードと同じ見た目で出し、題の下にサービス名
-- （display_name）を置くことで出所を示す（「PR」の文字は置かない方針）。
--
-- 管理は /admin/sponsors から。表示は誰でも（未ログイン含む）読めるが、
-- 書き込みと非表示カードの閲覧は superadmin だけ。
-- =====================================================================

create table sponsored_cards (
  id           uuid primary key default gen_random_uuid(),
  company      text not null,               -- 社内向けの会社名。画面には出さない
  display_name text not null,               -- 題の下に出すサービス名/ブランド名
  title        text not null,
  url          text not null,               -- タップで開く先
  image_url    text not null,               -- 背景画像。1600×1000px以上・16:10 を推奨
  active       boolean not null default true,
  position     integer not null default 0,  -- 小さいほど先に出る
  created_at   timestamptz default now()
);

comment on table sponsored_cards is
  'Exploreの「注目の旅」に混ぜるスポンサーカード。/admin/sponsors で管理。';
comment on column sponsored_cards.company is '社内向けの会社名。画面には出さない。';
comment on column sponsored_cards.display_name is '題の下に出すサービス名。これが出所の表示を兼ねる。';

-- ---- superadmin 判定 ----
-- is_admin()（0007）と同じ形。あちらは admin_role が入っていれば通すが、
-- 広告は金銭が絡むので superadmin まで絞る。
create or replace function is_superadmin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and admin_role = 'superadmin');
$$;

-- =====================================================================
-- RLS
-- =====================================================================
-- 表示中(active)のカードは誰でも読める ―― /explore はゲストにも見せる
-- 場所なので、anon でも select が通らないと出せない。
-- 非表示のカードを読めるのと、insert/update/delete は superadmin のみ。
alter table sponsored_cards enable row level security;

create policy sponsored_cards_select on sponsored_cards for select
  using (active or is_superadmin());
create policy sponsored_cards_write on sponsored_cards for all
  using (is_superadmin()) with check (is_superadmin());
