import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
        event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
              );
  } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency check
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
                    
