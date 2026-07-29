-- =====================================================================
-- 足跡 (Ashiato) — 0016: 送料を「日本国内 / 海外」からエリア別へ
-- =====================================================================
-- 実際の送料は距離ではなくエリアで決まるので、二分ではなく4つに分ける。
--
--   east-asia       ¥1,000  日本・韓国・台湾・香港・中国
--   southeast-asia  ¥1,300  タイ・ベトナム・シンガポールなど
--   west            ¥2,200  ヨーロッパ・北米・オセアニア
--   other           ¥2,500  南米・中東・アフリカなど
--
-- 一律料金なので、日本国内にあった「¥12,000以上で無料」は無くなる。
-- 金額の正はここ。画面の計算はこれの写し（lib/api.ts shippingFeeFor）。
-- =====================================================================

alter table orders add column if not exists shipping_region text;

-- 既存の注文（jp / overseas）を新しい区分へ寄せる
update orders
   set shipping_region = case when country = 'jp' then 'east-asia' else 'other' end
 where shipping_region is null;

-- country は残すが、これ以上は使わない（新しい注文は shipping_region を見る）
comment on column orders.country is
  '旧: jp / overseas。0016 以降は shipping_region を使う。過去データのために残している。';

-- 引数の数が変わるので、古い定義を先に落とす
drop function if exists shipping_fee_for(text, integer);

create or replace function shipping_fee_for(p_region text)
returns integer language sql immutable as $$
  select case p_region
    when 'east-asia'      then 1000
    when 'southeast-asia' then 1300
    when 'west'           then 2200
    else                       2500
  end;
$$;

comment on function shipping_fee_for is
  'お届けエリアごとの一律送料。冊数にも小計にもよらない。';

-- 管理者への通知に出す日本語のエリア名
create or replace function region_label(p_region text)
returns text language sql immutable as $$
  select case p_region
    when 'east-asia'      then '東アジア'
    when 'southeast-asia' then '東南アジア'
    when 'west'           then '欧米・オセアニア'
    else                       'その他の地域'
  end;
$$;

-- ---------------------------------------------------------------------
-- かご → 注文（エリアを受け取るよう差し替え）
-- ---------------------------------------------------------------------
drop function if exists checkout_cart(text, text, text, jsonb);

create or replace function checkout_cart(
  p_email     text,
  p_name      text,
  p_region    text,
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
  if p_region not in ('east-asia', 'southeast-asia', 'west', 'other') then
    raise exception 'unknown delivery region %', p_region;
  end if;

  select coalesce(sum(unit_price_jpy), 0) into v_subtotal from cart_items where user_id = v_uid;
  if v_subtotal = 0 then
    raise exception 'cart is empty';
  end if;

  v_ship := shipping_fee_for(p_region);

  insert into orders (buyer_id, status, amount_jpy, subtotal_jpy, shipping_fee_jpy,
                      email, recipient_name, shipping_region,
                      country, shipping_address)
  values (v_uid, 'pending', v_subtotal + v_ship, v_subtotal, v_ship,
          p_email, p_name, p_region,
          case when p_region = 'east-asia' then 'jp' else 'overseas' end,  -- 旧カラムの互換
          p_address)
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

  -- 注文が立った時点でも管理者へ知らせる（決済が繋がるまで埋もれないように）
  insert into admin_notifications (kind, title, body, order_id, payload)
  select 'order_placed',
         format('注文が入りました %s冊 · ¥%s（未決済）', count(*), to_char(v_subtotal + v_ship, 'FM999,999')),
         format('%s / %s / お届けエリア: %s',
                coalesce(nullif(p_name, ''), p_email),
                coalesce(string_agg(title, ' / ' order by created_at), ''),
                region_label(p_region)),
         v_order,
         jsonb_build_object('email', p_email, 'amount_jpy', v_subtotal + v_ship, 'region', p_region)
    from order_items where order_id = v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 決済完了（通知の文面をエリア表記へ）
-- ---------------------------------------------------------------------
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
    format('%s さん / %s / お届けエリア: %s',
           coalesce(nullif(v_buyer, ''), v_order.email),
           coalesce(v_titles, ''),
           region_label(coalesce(v_order.shipping_region, 'other'))),
    p_order,
    jsonb_build_object('email', v_order.email, 'amount_jpy', v_order.amount_jpy,
                       'region', v_order.shipping_region, 'books', v_count)
  );

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 参照系にエリアを載せる
-- ---------------------------------------------------------------------
create or replace function my_orders()
returns json language sql security definer stable as $$
  select coalesce((
    select json_agg(o order by o.created_at desc) from (
      select ord.id, ord.status::text as status, ord.amount_jpy, ord.subtotal_jpy,
             ord.shipping_fee_jpy, ord.shipping_region, ord.created_at, ord.paid_at,
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

create or replace function admin_orders()
returns json language sql security definer stable as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(o order by o.created_at desc) from (
      select ord.id, ord.status::text as status, ord.amount_jpy, ord.shipping_fee_jpy,
             ord.shipping_region, region_label(coalesce(ord.shipping_region,'other')) as region_ja,
             ord.email, ord.recipient_name, ord.shipping_address,
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
