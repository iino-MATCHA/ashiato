/**
 * Stripe からの入金通知。
 *
 * 入金が確定したと認めるのはここだけ。画面側の「支払いました」は信じない
 * （戻りURLは誰でも直接叩けるため）。
 * 署名を検証してから、セッションIDで注文を引き当てて paid にする。
 */
import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // Deno では非同期版でないと WebCrypto を待てない
    event = await stripe.webhooks.constructEventAsync(
      raw,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (e) {
    return new Response(`bad signature: ${e instanceof Error ? e.message : ''}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { error } = await admin.rpc('mark_order_paid_service', {
      p_session: s.id,
      p_payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null,
    });
    if (error) return new Response(error.message, { status: 500 });
  }

  // 扱わない種類のイベントも 200 で返す。返さないと Stripe が再送し続ける
  return new Response('ok', { status: 200 });
});
