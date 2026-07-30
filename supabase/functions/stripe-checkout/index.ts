/**
 * 注文を Stripe Checkout に渡し、支払いページのURLを返す。
 *
 * カード番号はこちらの画面を一度も通らない（Stripe のホスト型ページで打つ）。
 * 金額はクライアントから受け取らない。注文IDだけを受け取り、DBに保存された
 * 金額を読んで組み立てる。ここを緩めると値段を書き換えられる。
 */
import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { orderId, origin } = await req.json();
    if (!orderId) return json({ error: 'orderId required' }, 400);

    // 呼び手が誰かを確かめる。自分の注文しか払えない
    const auth = req.headers.get('Authorization') ?? '';
    const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: me } = await asUser.auth.getUser();
    if (!me?.user) return json({ error: 'not signed in' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: order } = await admin
      .from('orders')
      .select('id, buyer_id, status, amount_jpy, subtotal_jpy, shipping_fee_jpy, email')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) return json({ error: 'order not found' }, 404);
    if (order.buyer_id !== me.user.id) return json({ error: 'not your order' }, 403);
    if (order.status !== 'pending') return json({ error: 'already paid' }, 409);

    const { data: items } = await admin
      .from('order_items')
      .select('title, plan, unit_price_jpy, qty, cover_photo_url')
      .eq('order_id', orderId);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // 円は最小単位が1なので、金額をそのまま渡す（100倍しない）
    const lineItems = (items ?? []).map((i) => ({
      quantity: i.qty ?? 1,
      price_data: {
        currency: 'jpy',
        unit_amount: i.unit_price_jpy,
        product_data: {
          name: i.title,
          images: i.cover_photo_url ? [i.cover_photo_url] : undefined,
        },
      },
    }));
    if (order.shipping_fee_jpy > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'jpy',
          unit_amount: order.shipping_fee_jpy,
          product_data: { name: 'Shipping' },
        },
      } as never);
    }

    const base = typeof origin === 'string' && origin.startsWith('http')
      ? origin.replace(/\/$/, '')
      : 'https://www.my-japan-matcha.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: order.email ?? undefined,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      success_url: `${base}/order/${order.id}?paid=1`,
      cancel_url: `${base}/checkout`,
    });

    await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'checkout failed' }, 500);
  }
});
