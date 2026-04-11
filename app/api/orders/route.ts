import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role') || 'buyer';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  let query = supabase
    .from('orders')
    .select('*, listing:listings(id, title, materialType), buyer:users!buyerId(id, businessName), seller:users!sellerId(id, businessName)');

  if (role === 'buyer') query = query.eq('buyerId', user.id);
  else if (role === 'seller') query = query.eq('sellerId', user.id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('createdAt', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { orderId, action, evidence } = body;

  const validTransitions: Record<string, string[]> = {
    pending_payment: ['paid'],
    paid: ['in_transit'],
    in_transit: ['delivered'],
    delivered: ['confirmed', 'disputed'],
    disputed: ['refunded', 'confirmed'],
    confirmed: ['completed'],
  };

  // Get current order
  const { data: order } = await supabase.from('orders').select().eq('id', orderId).single();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Cannot transition from ${order.status} to ${action}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status: action };
  if (action === 'confirmed') updates.confirmedAt = new Date().toISOString();
  if (action === 'delivered' && evidence) updates.deliveryEvidence = evidence;
  if (action === 'disputed' && body.reason) updates.disputeReason = body.reason;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
