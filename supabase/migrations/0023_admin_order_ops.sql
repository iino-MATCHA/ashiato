-- =====================================================================
-- My Japan — 0023: 注文をさばくための土台
-- =====================================================================
-- 決済が通ると管理者へ通知は飛ぶが、そのあと「誰の何を刷って、どこへ
-- 送ったか」を追う場所が無かった。注文一覧に必要な情報を足し、
-- 状態を進める入口を1つ用意する。
--
-- 状態は既存の order_status をそのまま使う:
--   pending → paid → printing → shipped → delivered （／cancelled, refunded）
-- =====================================================================

-- 追跡番号。発送したら控えておく（問い合わせが来たときに必要）
alter table orders add column if not exists tracking_no text;
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists admin_note text;

comment on column orders.tracking_no is '配送の追跡番号。発送時に管理者が入れる。';
comment on column orders.admin_note is '運用メモ。印刷所への指示や、問い合わせの経緯など。';

-- ---------------------------------------------------------------------
-- 注文一覧（管理者のみ）
-- ---------------------------------------------------------------------
-- 部数(qty)と入金時刻、印刷用の画像URLまで返す。
-- これが無いと、何冊刷ればいいのかが一覧から分からない。
create or replace function admin_orders()
returns json language sql stable security definer as $$
  select case when not is_admin() then null else coalesce((
    select json_agg(o order by o.created_at desc) from (
      select ord.id, ord.status::text as status, ord.amount_jpy, ord.subtotal_jpy,
             ord.shipping_fee_jpy,
             ord.shipping_region, region_label(coalesce(ord.shipping_region,'other')) as region_ja,
             ord.email, ord.recipient_name, ord.shipping_address,
             ord.tracking_no, ord.admin_note,
             ord.created_at, ord.paid_at, ord.shipped_at,
             ord.created_at::date::text as ordered,
             p.username as buyer,
             coalesce((select sum(oi.qty) from order_items oi where oi.order_id = ord.id), 0) as books,
             coalesce((
               select json_agg(json_build_object(
                 'title', oi.title, 'plan', oi.plan, 'qty', oi.qty,
                 'page_count', oi.page_count,
                 'unit_price_jpy', oi.unit_price_jpy, 'page_urls', oi.page_urls)
                 order by oi.created_at)
               from order_items oi where oi.order_id = ord.id
             ), '[]'::json) as items
      from orders ord
      left join profiles p on p.id = ord.buyer_id
      order by ord.created_at desc
      limit 200
    ) o
  ), '[]'::json) end;
$$;

-- ---------------------------------------------------------------------
-- 状態を進める（管理者のみ）
-- ---------------------------------------------------------------------
-- 入金の確定は Stripe の webhook だけが行う。ここから paid にはできない。
create or replace function admin_set_order_status(
  p_order    uuid,
  p_status   text,
  p_tracking text default null,
  p_note     text default null
) returns boolean language plpgsql security definer as $$
begin
  if not is_admin() then
    return false;
  end if;
  if p_status not in ('printing', 'shipped', 'delivered', 'cancelled', 'refunded') then
    raise exception 'cannot set % from here', p_status;
  end if;

  update orders
     set status      = p_status::order_status,
         tracking_no = coalesce(nullif(p_tracking, ''), tracking_no),
         admin_note  = coalesce(nullif(p_note, ''), admin_note),
         shipped_at  = case when p_status = 'shipped' then now() else shipped_at end,
         updated_at  = now()
   where id = p_order;

  return found;
end;
$$;

comment on function admin_set_order_status is
  '注文の状態を進める。paid にはできない（入金の確定は webhook のみ）。';
