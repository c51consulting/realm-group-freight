import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for an order that is in `pending_payment`
 * status. The buyer (authenticated via Supabase) is redirected to Stripe
 * Checkout, and the resulting `checkout.session.completed` webhook flips the
 * order to `paid` via the existing handler.
 *
 * Request body:
 *   { orderId: string }   // UUID of an order owned by the authenticated buyer
 *
 * Response:
 *   { url: string, sessionId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: { orderId?: string; order_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orderId = body.orderId || body.order_id;
  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // UUID format guard so malformed ids return 400 instead of 500 from Postgres
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
  }

  // Fetch order, joined to listing for title + seller info
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, freight_amount, buyer_id, seller_id,
      listing_id, order_number,
      listing:listings!listing_id(title, material_type, unit_type)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'You are not the buyer on this order' }, { status: 403 });
  }

  if (order.status !== 'pending_payment') {
    return NextResponse.json(
      { error: `Order is already ${order.status}; cannot create checkout` },
      { status: 409 }
    );
  }

  const totalAmount = Number(order.total_amount);
  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ error: 'Order has no payable amount' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
  const platformFeeCents = Math.round(totalAmount * 100 * (PLATFORM_FEE_PERCENT / 100));

  // Build display name from the joined listing (defensive against null)
  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const productName =
    (listing?.title as string) ||
    `Order ${order.order_number || order.id.slice(0, 8)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: Math.round(totalAmount * 100),
            product_data: {
              name: productName,
              description: order.order_number
                ? `REALM order ${order.order_number}`
                : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      // Critical: orderId in metadata lets the webhook flip the order to `paid`
      metadata: {
        orderId: order.id,
        sellerId: order.seller_id ?? '',
        platformFeeCents: platformFeeCents.toString(),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          sellerId: order.seller_id ?? '',
        },
      },
      success_url: `${appUrl}/orders/${order.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/orders/${order.id}?payment=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a Checkout URL' }, { status: 502 });
    }

    // Optimistically record the session id on the order so we can correlate
    // even before the webhook lands.
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe checkout creation failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create Stripe checkout session' },
      { status: 500 }
    );
  }
}
