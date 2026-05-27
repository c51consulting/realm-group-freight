import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Orders API
 *
 * Schema reference (snake_case throughout — matches Supabase migration 001):
 *   id, offer_id, listing_id, buyer_id, seller_id, carrier_id, order_number,
 *   status, total_amount, freight_amount, platform_fee, payment_held,
 *   payment_released_at, stripe_payment_intent_id, stripe_checkout_session_id,
 *   quality_assurance_level, contract_terms, delivery_evidence, confirmed_at,
 *   dispute_reason, dispute_id, created_at, updated_at
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role') || 'buyer';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  let query = supabase
    .from('orders')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type),
      buyer:users!buyer_id(id, business_name),
      seller:users!seller_id(id, business_name)
    `);

  if (role === 'buyer') query = query.eq('buyer_id', user.id);
  else if (role === 'seller') query = query.eq('seller_id', user.id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await request.json();
  const orderId = body.orderId || body.order_id;
  const action = body.action;
  const evidence = body.evidence;

  if (!orderId || !action) {
    return NextResponse.json({ error: 'orderId and action are required' }, { status: 400 });
  }

  const validTransitions: Record<string, string[]> = {
    pending_payment: ['paid'],
    paid: ['in_transit'],
    in_transit: ['delivered'],
    delivered: ['confirmed', 'disputed'],
    disputed: ['refunded', 'confirmed'],
    confirmed: ['completed'],
  };

  const { data: order } = await supabase
    .from('orders')
    .select()
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Only the buyer or seller on this order may transition it
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
  }

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(action)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${action}` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    status: action,
    updated_at: new Date().toISOString(),
  };
  if (action === 'confirmed') updates.confirmed_at = new Date().toISOString();
  if (action === 'delivered' && evidence) updates.delivery_evidence = evidence;
  if (action === 'disputed' && body.reason) updates.dispute_reason = body.reason;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
