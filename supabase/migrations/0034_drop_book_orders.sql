-- 0034: 製本の販売をやめる（かご・注文・決済・管理者通知を落とす）
--
-- 印刷版の販売は取りやめになった。アプリの軸は「アフィリエイト」と
-- 「MATCHAの体験を良くすること」に移り、本は**PDFのジャーナル**だけが残る。
-- PDFはクライアント側（lib/photobook）で組み立てて端末に落とすだけなので、
-- DBには何も要らない ―― ここで落とす表・関数はすべて購入のためのものだけ。
--
-- 残すもの（触っていない）:
--   trips / logs / photos / goshuin / sponsored_cards / profiles ほか。
--   ジャーナルの手直し（表紙・ページごとの割付）は端末の localStorage にあり、
--   もともとDBを使っていない。
--
-- 落とすもの:
--   cart_items         かご
--   order_items        注文明細
--   orders             注文（0001 から在る）
--   books              印刷用の成果物（0001 から在る。PDFはこれを使っていない）
--   admin_notifications 注文の通知。積む側が注文の関数しか無いので一緒に落とす
--   関連する関数・型
--
-- **二度貼っても壊れない**（すべて if exists）。
-- 注文データが本番に残っている場合、これは消える。落とす前に控えが要るなら
-- 先に select して手元に保存すること。2026-08-29 時点の本番は注文0件。

begin;

-- ---------------------------------------------------------------------
-- 関数（表より先に落とす。表に依存しているものがある）
-- ---------------------------------------------------------------------
drop function if exists checkout_cart(text, text, text, jsonb);
drop function if exists checkout_cart(text, text, text, text, jsonb);
drop function if exists mark_order_paid(uuid, text);
drop function if exists mark_order_paid_service(text, text);
drop function if exists my_orders();
drop function if exists admin_orders();
drop function if exists admin_set_order_status(uuid, text, text, text);
drop function if exists admin_notifications_list(integer);
drop function if exists admin_notifications_mark_read(uuid);
drop function if exists shipping_fee_for(text);
drop function if exists shipping_fee_for(text, integer);
drop function if exists book_weight_g(text);
drop function if exists region_label(text);

-- 引数違いで残っているものを名前だけで掃除する。
-- （0014→0016→0019 と作り直しているので、古い署名が残っていることがある）
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'checkout_cart', 'mark_order_paid', 'mark_order_paid_service',
        'my_orders', 'admin_orders', 'admin_set_order_status',
        'admin_notifications_list', 'admin_notifications_mark_read',
        'shipping_fee_for', 'book_weight_g', 'region_label'
      )
  loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 表（参照している側から落とす）
-- ---------------------------------------------------------------------
drop table if exists admin_notifications cascade;
drop table if exists cart_items cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists books cascade;

-- ---------------------------------------------------------------------
-- 型（表を落としたあとでないと落ちない）
-- ---------------------------------------------------------------------
drop type if exists order_status;
drop type if exists book_status;

commit;
