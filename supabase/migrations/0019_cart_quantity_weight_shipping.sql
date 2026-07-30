-- =====================================================================
-- My Japan — 0019: 部数と、重さで変わる送料
-- =====================================================================
-- これまでは「1行 = 1冊」で、送料もエリアだけで決まる一律料金だった。
-- 同じ本を3冊贈りたいときに行を増やせず、3冊でも1冊でも送料が同じという
-- 実態と合わない状態だったので、次の2つを入れる。
--
--  * cart_items.qty / order_items.qty … 部数
--  * shipping_fee_for(region, weight_g) … 重さで段階的に上がる送料
--
-- 重さの決め方：本1冊の重量は仕様（premium / regular）で決まる。
-- 最初の 1kg までが基本料金、そこから 1kg ごとに追加料金が乗る。
-- 実際の梱包重量に完全一致させるのは無理なので、封筒と緩衝材を 200g として
-- 一律で足している。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 部数
-- ---------------------------------------------------------------------
alter table cart_items  add column if not exists qty integer not null default 1;
alter table order_items add column if not exists qty integer not null default 1;

alter table cart_items  drop constraint if exists cart_items_qty_range;
alter table cart_items  add  constraint cart_items_qty_range  check (qty between 1 and 20);
alter table order_items drop constraint if exists order_items_qty_range;
alter table order_items add  constraint order_items_qty_range check (qty between 1 and 20);

comment on column cart_items.qty  is '部数。unit_price_jpy は1冊あたりの値段のまま。';
comment on column order_items.qty is '部数。unit_price_jpy は1冊あたりの値段のまま。';

-- ---------------------------------------------------------------------
-- 1冊の重さ
-- ---------------------------------------------------------------------
create or replace function book_weight_g(p_plan text)
returns integer language sql immutable as $$
  select case p_plan
    when 'premium' then 720   -- 蛇腹折り・厚紙表紙
    else                420   -- 並製
  end;
$$;

comment on function book_weight_g is
  '製本仕様ごとの1冊あたり重量(g)。送料の段階を決めるためだけに使う。';

-- ---------------------------------------------------------------------
-- 送料：エリア × 重さ
-- ---------------------------------------------------------------------
-- 旧: shipping_fee_for(region) 一律。呼び出し側を全部移すので落とす。
drop function if exists shipping_fee_for(text);

create or replace function shipping_fee_for(p_region text, p_weight_g integer default 0)
returns integer language sql immutable as $$
  with r as (
    select
      case p_region
        when 'east-asia'      then 1000
        when 'southeast-asia' then 1300
        when 'west'           then 2200
        else                       2500
      end as base,
      case p_region
        when 'east-asia'      then  600
        when 'southeast-asia' then  800
        when 'west'           then 1400
        else                       1600
      end as step
  )
  -- 最初の1kgまでは基本料金。以降は1kgごとに step を足す（端数は切り上げ）
  select r.base + r.step * greatest(0, ceil((greatest(p_weight_g, 0) + 200 - 1000)::numeric / 1000))::integer
    from r;
$$;

comment on function shipping_fee_for is
  'お届けエリアと総重量(g)から送料(円)。梱包material 200g を上乗せしたうえで、'
  '1kgまで基本料金、以降1kgごとに加算。金額の正はこの関数。';

-- ---------------------------------------------------------------------
-- かご → 注文（部数と重さを見る）
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
  v_weight   integer;
  v_books    integer;
  v_ship     integer;
  v_order    uuid;
  v_item     record;
  v_book     uuid;
  v_i        integer;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if p_region not in ('east-asia', 'southeast-asia', 'west', 'other') then
    raise exception 'unknown delivery region %', p_region;
  end if;

  select coalesce(sum(unit_price_jpy * qty), 0),
         coalesce(sum(book_weight_g(plan) * qty), 0),
         coalesce(sum(qty), 0)
    into v_subtotal, v_weight, v_books
    from cart_items where user_id = v_uid;

  if v_subtotal = 0 then
    raise exception 'cart is empty';
  end if;

  v_ship := shipping_fee_for(p_region, v_weight);

  insert into orders (buyer_id, status, amount_jpy, subtotal_jpy, shipping_fee_jpy,
                      email, recipient_name, shipping_region,
                      country, shipping_address)
  values (v_uid, 'pending', v_subtotal + v_ship, v_subtotal, v_ship,
          p_email, p_name, p_region,
          case when p_region = 'east-asia' then 'jp' else 'overseas' end,  -- 旧カラムの互換
          p_address)
  returning id into v_order;

  for v_item in select * from cart_items where user_id = v_uid order by created_at loop
    -- 印刷に回す実体は「1冊 = books 1行」。部数の分だけ立てる
    -- （製本と発送は冊ごとの作業なので、まとめて1行にしない）
    for v_i in 1 .. v_item.qty loop
      insert into books (trip_id, created_by, title, cover_photo_url, status, layout, page_count)
      values (v_item.trip_id, v_uid, v_item.title, v_item.cover_photo_url, 'ordered',
              jsonb_build_object('plan', v_item.plan, 'pages', v_item.page_urls),
              v_item.page_count)
      returning id into v_book;

      if v_i = 1 then
        insert into order_items (order_id, trip_id, book_id, plan, title, cover_photo_url,
                                 page_count, page_urls, unit_price_jpy, qty)
        values (v_order, v_item.trip_id, v_book, v_item.plan, v_item.title, v_item.cover_photo_url,
                v_item.page_count, v_item.page_urls, v_item.unit_price_jpy, v_item.qty);
      end if;
    end loop;
  end loop;

  delete from cart_items where user_id = v_uid;

  insert into admin_notifications (kind, title, body, order_id, payload)
  select 'order_placed',
         format('注文が入りました %s冊 · ¥%s（未決済）', v_books, to_char(v_subtotal + v_ship, 'FM999,999')),
         format('%s / %s / お届けエリア: %s / 総重量 約%sg',
                coalesce(nullif(p_name, ''), p_email),
                coalesce(string_agg(format('%s×%s', title, qty), ' / ' order by created_at), ''),
                region_label(p_region),
                v_weight + 200),
         v_order,
         jsonb_build_object('email', p_email, 'amount_jpy', v_subtotal + v_ship,
                            'region', p_region, 'books', v_books, 'weight_g', v_weight + 200)
    from order_items where order_id = v_order;

  return v_order;
end;
$$;
