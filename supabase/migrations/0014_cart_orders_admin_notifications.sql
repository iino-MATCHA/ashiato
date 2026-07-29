-- =====================================================================
-- 足跡 (Ashiato) — 0014: 購入かご / 注文明細 / 管理者通知
-- =====================================================================
-- 製本の導線を「かご → 決済（住所・送料・Stripe）→ 完了」の3画面にする。
--
-- 設計の要点
--  * かごに入れた時点で、その本の全ページ画像を Storage に焼いて URL を持つ。
--    あとから旅を編集されても、注文された中身は動かない。印刷所に渡すのは
--    このURLの列であって、旅の現在の姿ではない。
--  * orders は「1注文 = 複数冊」になるので明細を order_items に出す。
--    既存の orders.book_id は1冊しか持てないので not null を外す。
--  * 決済完了は mark_order_paid() だけが通る道にして、そこで管理者通知を積む。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 購入かご
-- ---------------------------------------------------------------------
create table if not exists cart_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles (id) on delete cascade,
  trip_id        uuid not null references trips (id) on delete cascade,
  plan           text not null check (plan in ('premium', 'regular')),
  title          text not null,
  cover_photo_url text,
  page_count     integer not null default 0,
  photo_count    integer not null default 0,
  -- 焼き付けた全ページ画像（Storage の公開URL）を順番どおりに持つ
  page_urls      jsonb not null default '[]'::jsonb,
  unit_price_jpy integer not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- 同じ旅・同じ仕様を二重にかごへ入れない
  unique (user_id, trip_id, plan)
);

create index if not exists idx_cart_items_user on cart_items (user_id, created_at desc);

alter table cart_items enable row level security;

drop policy if exists cart_items_owner on cart_items;
create policy cart_items_owner on cart_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists trg_cart_items_updated_at on cart_items;
create trigger trg_cart_items_updated_at before update on cart_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 注文（既存テーブルの拡張）
-- ---------------------------------------------------------------------
alter table orders alter column book_id drop not null;

alter table orders
  add column if not exists email            text,
  add column if not exists recipient_name   text,
  add column if not exists country          text not null default 'jp',
  add column if not exists subtotal_jpy     integer not null default 0,
  add column if not exists shipping_fee_jpy integer not null default 0,
  add column if not exists paid_at          timestamptz;

create index if not exists idx_orders_buyer on orders (buyer_id, created_at desc);

-- ---------------------------------------------------------------------
-- 注文明細
-- ---------------------------------------------------------------------
create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders (id) on delete cascade,
  trip_id        uuid references trips (id) on delete set null,
  book_id        uuid references books (id) on delete set null,
  plan           text not null,
  title          text not null,
  cover_photo_url text,
  page_count     integer not null default 0,
  page_urls      jsonb not null default '[]'::jsonb,
  unit_price_jpy integer not null,
  qty            integer not null default 1,
  created_at     timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items (order_id);

alter table order_items enable row level security;

drop policy if exists order_items_buyer on order_items;
create policy order_items_buyer on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 管理者通知（/admin のベルに出す）
-- ---------------------------------------------------------------------
create table if not exists admin_notifications (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,                       -- 'order_paid' など
  title      text not null,
  body       text,
  order_id   uuid references orders (id) on delete cascade,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_new on admin_notifications (created_at desc);

alter table admin_notifications enable row level security;

-- 読めるのは管理者だけ。書き込みは security definer の関数からのみ。
drop policy if exists admin_notifications_read on admin_notifications;
create policy admin_notifications_read on admin_notifications for select
  using (is_admin());
drop policy if exists admin_notifications_mark on admin_notifications;
create policy admin_notifications_mark on admin_notifications for update
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- かご → 注文
-- ---------------------------------------------------------------------
-- かごの中身をそのまま注文へ移し、かごを空にする。
-- 金額はクライアントから受け取らず、かごに保存された単価から組み立てる。
-- 送料だけは配送先で決まるので、決め方をサーバ側にも置く（下の shipping_fee_for）。
create or replace function shipping_fee_for(p_country text, p_subtotal integer)
returns integer language sql immutable as $$
  select case
    when p_country = 'jp' then case when p_subtotal >= 12000 then 0 else 800 end
    else 3500
  end;
$$;

create or replace function checkout_cart(
  p_email     text,
  p_name      text,
  p_country   text,
  p_address   jsonb
) returns uuid language plpgsql security definer as $$
declare
  v_uid      uuid := auth.uid();
  v_subtotal integer;
  v_ship     integer;
  v_order    uuid;
  v_item     record;
  v_book     uuid;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if p_country not in ('jp', 'overseas') then
    raise exception 'unknown destination %', p_country;
  end if;

  select coalesce(sum(unit_price_jpy), 0) into v_subtotal from cart_items where user_id = v_uid;
  if v_subtotal = 0 then
    raise exception 'cart is empty';
  end if;

  v_ship := shipping_fee_for(p_country, v_subtotal);

  insert into orders (buyer_id, status, amount_jpy, subtotal_jpy, shipping_fee_jpy,
                      email, recipient_name, country, shipping_address)
  values (v_uid, 'pending', v_subtotal + v_ship, v_subtotal, v_ship,
          p_email, p_name, p_country, p_address)
  returning id into v_order;

  for v_item in select * from cart_items where user_id = v_uid order by created_at loop
    -- 印刷に回す実体として books を1冊立てる（layout に全ページを持たせる）
    insert into books (trip_id, created_by, title, cover_photo_url, status, layout, page_count)
    values (v_item.trip_id, v_uid, v_item.title, v_item.cover_photo_url, 'ordered',
            jsonb_build_object('plan', v_item.plan, 'pages', v_item.page_urls),
            v_item.page_count)
    returning id into v_book;

    insert into order_items (order_id, trip_id, book_id, plan, title, cover_photo_url,
                             page_count, page_urls, unit_price_jpy)
    values (v_order, v_item.trip_id, v_book, v_item.plan, v_item.title, v_item.cover_photo_url,
            v_item.page_count, v_item.page_urls, v_item.unit_price_jpy);
  end loop;

  delete from cart_items where user_id = v_uid;

  -- 注文が立った時点でも管理者へ知らせる。
  -- 決済が繋がるまで paid には進まないので、ここを出さないと /admin から
  -- 注文の存在が見えないまま埋もれる。
  insert into admin_notifications (kind, title, body, order_id, payload)
  select 'order_placed',
         format('注文が入りました %s冊 · ¥%s（未決済）', count(*), to_char(v_subtotal + v_ship, 'FM999,999')),
         format('%s / %s / 送り先: %s',
                coalesce(nullif(p_name, ''), p_email),
                coalesce(string_agg(title, ' / ' order by created_at), ''),
                case when p_country = 'jp' then '日本国内' else '海外' end),
         v_order,
         jsonb_build_object('email', p_email, 'amount_jpy', v_subtotal + v_ship, 'country', p_country)
    from order_items where order_id = v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 決済完了
-- ---------------------------------------------------------------------
-- ここを通ったときだけ paid になり、同時に管理者通知が1件積まれる。
-- 二重に呼ばれても通知は増えない（すでに paid なら何もしない）。
create or replace function mark_order_paid(p_order uuid, p_payment_intent text default null)
returns boolean language plpgsql security definer as $$
declare
  v_order  orders%rowtype;
  v_buyer  text;
  v_titles text;
  v_count  integer;
begin
  select * into v_order from orders where id = p_order;
  if not found then
    return false;
  end if;
  if v_order.buyer_id <> auth.uid() and not is_admin() then
    return false;
  end if;
  if v_order.status <> 'pending' then
    return true;             -- すでに支払い済み。通知は積み直さない
  end if;

  update orders
     set status = 'paid', paid_at = now(),
         stripe_payment_intent = coalesce(p_payment_intent, stripe_payment_intent)
   where id = p_order;

  select coalesce(p.display_name, p.username, '') into v_buyer
    from profiles p where p.id = v_order.buyer_id;

  select count(*), string_agg(title, ' / ' order by created_at)
    into v_count, v_titles
    from order_items where order_id = p_order;

  insert into admin_notifications (kind, title, body, order_id, payload)
  values (
    'order_paid',
    format('新しい注文 %s冊 · ¥%s', v_count, to_char(v_order.amount_jpy, 'FM999,999')),
    format('%s さん / %s / 送り先: %s',
           coalesce(nullif(v_buyer, ''), v_order.email),
           coalesce(v_titles, ''),
           case when v_order.country = 'jp' then '日本国内' else '海外' end),
    p_order,
    jsonb_build_object('email', v_order.email, 'amount_jpy', v_order.amount_jpy,
                       'country', v_order.country, 'books', v_count)
  );

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 参照系
-- ---------------------------------------------------------------------
-- 自分の注文履歴（明細つき）
create or replace function my_orders()
returns json language sql security definer stable as $$
  select coalesce((
    select json_agg(o order by o.created_at desc) from (
      select ord.id, ord.status::text as status, ord.amount_jpy, ord.subtotal_jpy,
             ord.shipping_fee_jpy, ord.country, ord.created_at, ord.paid_at,
             coalesce((
               select json_agg(json_build_object(
                 'id', oi.id, 'trip_id', oi.trip_id, 'plan', oi.plan, 'title', oi.title,
                 'cover_photo_url', oi.cover_photo_url, 'page_count', oi.page_count,
                 'unit_price_jpy', oi.unit_price_jpy) order by oi.created_at)
               from order_items oi where oi.order_id = ord.id
             ), '[]'::json) as items
      from orders ord
      where ord.buyer_id = auth.uid()
    ) o
  ), '[]'::json);
$$;

-- 管理者向け通知一覧
create or replace function admin_notifications_list(p_limit integer default 50)
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(n order by n.created_at desc) from (
      select id, kind, title, body, order_id, payload, read_at, created_at
      from admin_notifications
      order by created_at desc
      limit p_limit
    ) n
  ), '[]'::json) end;
$$;

create or replace function admin_notifications_mark_read(p_id uuid default null)
returns boolean language plpgsql security definer as $$
begin
  if not is_admin() then
    return false;
  end if;
  if p_id is null then
    update admin_notifications set read_at = now() where read_at is null;
  else
    update admin_notifications set read_at = now() where id = p_id and read_at is null;
  end if;
  return true;
end;
$$;

-- 管理者の注文一覧を明細つきに差し替え
create or replace function admin_orders()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(o order by o.created_at desc) from (
      select ord.id, ord.status::text as status, ord.amount_jpy, ord.shipping_fee_jpy,
             ord.country, ord.email, ord.recipient_name, ord.shipping_address,
             ord.created_at, ord.created_at::date::text as ordered,
             p.username as buyer,
             coalesce((
               select json_agg(json_build_object(
                 'title', oi.title, 'plan', oi.plan, 'page_count', oi.page_count,
                 'unit_price_jpy', oi.unit_price_jpy, 'page_urls', oi.page_urls)
                 order by oi.created_at)
               from order_items oi where oi.order_id = ord.id
             ), '[]'::json) as items
      from orders ord
      left join profiles p on p.id = ord.buyer_id
      order by ord.created_at desc
      limit 100
    ) o
  ), '[]'::json) end;
$$;
