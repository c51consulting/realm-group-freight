import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- Lazy singletons ----------
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  _stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  return _stripe;
}

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase env vars are not configured');
  _supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _supabase;
}

// ---------- Hostinger Reach tagging (Pro / Industry paid tiers) ----------
const REACH_TAG_BY_PRICE: Record<string, string> = {
  // Map your Stripe Price IDs to Reach audience tag IDs.
  // Set REACH_PRICE_PRO / REACH_PRICE_INDUSTRY and REACH_TAG_PRO / REACH_TAG_INDUSTRY in env.
  ...(process.env.REACH_PRICE_PRO && process.env.REACH_TAG_PRO
    ? { [process.env.REACH_PRICE_PRO]: process.env.REACH_TAG_PRO }
    : {}),
  ...(process.env.REACH_PRICE_INDUSTRY && process.env.REACH_TAG_INDUSTRY
    ? { [process.env.REACH_PRICE_INDUSTRY]: process.env.REACH_TAG_INDUSTRY }
    : {}),
};

async function applyReachTag(email: string, priceId: string | undefined) {
  if (!email || !priceId) return;
  const tagId = REACH_TAG_BY_PRICE[priceId];
  const apiKey = process.env.REACH_API_KEY;
  const resourceId = process.env.REACH_RESOURCE_ID;
  if (!tagId || !apiKey || !resourceId) return;

  try {
    // 1) Look up contact by email (idempotent)
    const lookup = await fetch(
      `https://api.hostinger.com/reach/v1/resources/${resourceId}/contacts?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!lookup.ok) {
      console.error('Reach lookup failed', await lookup.text());
      return;
    }
    const found = (await lookup.json()) as { data?: Array<{ id: string }> };
    let contactId = found.data?.[0]?.id;

    // 2) Create contact if missing
    if (!contactId) {
      const create = await fetch(
        `https://api.hostinger.com/reach/v1/resources/${resourceId}/contacts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, status: 'subscribed' }),
        }
      );
      if (!create.ok) {
        console.error('Reach create failed', await create.text());
        return;
      }
      const created = (await create.json()) as { data?: { id: string } };
      contactId = created.data?.id;
    }
    if (!contactId) return;

    // 3) Apply tag
    const tagRes = await fetch(
      `https://api.hostinger.com/reach/v1/resources/${resourceId}/contacts/${contactId}/tags`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag_ids: [tagId] }),
      }
    );
    if (!tagRes.ok) {
      console.error('Reach tag apply failed', await tagRes.text());
    }
  } catch (err) {
    console.error('Reach tagging error', err);
  }
}

// ---------- Webhook ----------
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing Stripe-Signature header', { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let stripe: Stripe;
  let supabase: SupabaseClient;
  try {
    stripe = getStripe();
    supabase = getSupabase();
  } catch (err: any) {
    console.error('Webhook env error:', err.message);
    return new NextResponse(`Configuration Error: ${err.message}`, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency check
  const { data: existingEvent, error: lookupErr } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (lookupErr) {
    console.error('Idempotency lookup error:', lookupErr);
    // Don't 500 here — let Stripe retry only if we truly failed to handle.
  }
  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (orderId && !UUID_RE.test(orderId)) {
          console.warn(
            `checkout.session.completed has non-UUID orderId metadata: ${orderId} (session ${session.id}). Skipping DB update.`
          );
        } else if (orderId) {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
          if (error) throw error;
        } else {
          console.warn('checkout.session.completed missing orderId metadata', session.id);
        }

        // Newsletter tier tagging — expand line items to get the price id
        try {
          const full = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price'],
          });
          const email =
            full.customer_details?.email ||
            full.customer_email ||
            (session.metadata?.email as string | undefined) ||
            '';
          const priceId = full.line_items?.data?.[0]?.price?.id;
          await applyReachTag(email, priceId);
        } catch (err) {
          console.error('Reach tagging skipped:', err);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', pi.id);
        if (error) throw error;
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          await supabase
            .from('orders')
            .update({
              status: charge.amount_refunded === charge.amount ? 'refunded' : 'partial_refund',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', piId);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const piId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        if (piId) {
          await supabase
            .from('orders')
            .update({
              status: 'disputed',
              dispute_id: dispute.id,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', piId);
        }
        break;
      }

      default:
        // Acknowledge unhandled event types so Stripe doesn't retry them.
        break;
    }

    // Mark event processed AFTER successful handling
    const { error: insertErr } = await supabase
      .from('processed_stripe_events')
      .insert({ id: event.id });
    if (insertErr && insertErr.code !== '23505' /* unique violation */) {
      console.error('Failed to record processed event:', insertErr);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Handler error for ${event.type} (${event.id}):`, err);
    // Return 500 so Stripe retries
    return new NextResponse(`Handler Error: ${err.message ?? 'unknown'}`, { status: 500 });
  }
}
