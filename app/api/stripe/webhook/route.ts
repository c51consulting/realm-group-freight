import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  _supabase = createClient(url, serviceKey);
  return _supabase;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  const stripe = getStripe();
  const supabase = getSupabase();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const { data: existingEvent } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.metadata?.orderId);
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }
      default:
        break;
    }

    await supabase.from('processed_stripe_events').insert({ id: event.id });
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return new NextResponse(`Handler Error: ${err.message}`, { status: 500 });
  }
}
