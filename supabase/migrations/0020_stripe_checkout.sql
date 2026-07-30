-- =====================================================================
-- My Japan — 0020: Stripe Checkout をつなぐ
-- =====================================================================
-- 支払いは Stripe のホスト型 Checkout に飛ばす。カード番号がこちらの
-- 画面を一度も通らないので、こちらで持つ必要のある情報が最小で済む。
--
-- 入金の確定は webhook からしか通さない。
-- 既存の mark_order_paid() は「呼んだ人が買った本人か管理者か」を見るが、
-- webhook には呼び手がいない（service_role で入ってくる）ので通れない。
-- そのため webhook 専用の入口を別に立て、権限を service_role だけに絞る。
-- =====================================================================

alter table orders add column if not exists stripe_session_id text;
create index if not exists idx_orders_stripe_session on orders (stripe_session_id);

comment on column orders.stripe_session_id is
  'Stripe Checkout セッションID。webhook から注文を引き当てるために持つ。';

-- ---------------------------------------------------------------------
-- webhook 専用の入金確定
-- ---------------------------------------------------------------------
create or replace function mark_order_paid_service(
  p_session        text,
  p_payment_intent text default null
) returns boolean language plpgsql security definer as $$
declare
  v_order  orders%rowtype;
  v_buyer  text;
  v_titles text;
  v_count  integer;
begin
  select * into v_order from orders where stripe_session_id = p_session;
  if not found then
    return false;
  end if;
  if v_order.status <> 'pending' then
    return true;             -- 同じ webhook が二度来ても通知は積み直さない
  end if;

  update orders
     set status = 'paid', paid_at = now(),
         stripe_payment_intent = coalesce(p_payment_intent, stripe_payment_intent)
   where id = v_order.id;

  select coalesce(p.display_name, p.username, '') into v_buyer
    from profiles p where p.id = v_order.buyer_id;

  select coalesce(sum(qty), 0), string_agg(format('%s×%s', title, qty), ' / ' order by created_at)
    into v_count, v_titles
    from order_items where order_id = v_order.id;

  insert into admin_notifications (kind, title, body, order_id, payload)
  values ('order_paid',
          format('決済が完了しました %s冊 · ¥%s', v_count, to_char(v_order.amount_jpy, 'FM999,999')),
          format('%s / %s / お届けエリア: %s',
                 coalesce(nullif(v_buyer, ''), v_order.email),
                 coalesce(v_titles, ''),
                 region_label(v_order.shipping_region)),
          v_order.id,
          jsonb_build_object('email', v_order.email, 'amount_jpy', v_order.amount_jpy,
                             'stripe_session', p_session));
  return true;
end;
$$;

-- 買い手や未ログインからは呼べないようにする。webhook（service_role）だけ。
revoke all on function mark_order_paid_service(text, text) from public, anon, authenticated;
grant execute on function mark_order_paid_service(text, text) to service_role;

comment on function mark_order_paid_service is
  'Stripe webhook 専用。セッションIDから注文を引き当てて paid にし、管理者通知を積む。';
