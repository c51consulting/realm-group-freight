import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { validateOffer } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  const buyerId = searchParams.get('buyerId');
  const status = searchParams.get('status');

  let query = supabase
    .from('offers')
    .select('*, listing:listings(id, title, materialType), buyer:users!buyerId(id, businessName)');

  if (listingId) query = query.eq('listingId', listingId);
  if (buyerId) query = query.eq('buyerId', buyerId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offers: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const validation = validateOffer(body);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const totalPrice = Number(body.pricePerUnit) * Number(body.quantity) + Number(body.freightPrice || 0);

  const { data, error } = await supabase
    .from('offers')
    .insert({
      ...body,
      buyerId: user.id,
      totalPrice,
      status: 'pending',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { offerId, action } = body;

  if (!offerId || !['accept', 'reject', 'withdraw'].includes(action)) {
    return NextResponse.json({ error: 'Invalid offerId or action' }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    accept: 'accepted', reject: 'rejected', withdraw: 'withdrawn',
  };

  const { data, error } = await supabase
    .from('offers')
    .update({ status: statusMap[action] })
    .eq('id', offerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If accepted, create an order
  if (action === 'accept' && data) {
    const orderNumber = `RM-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from('orders').insert({
      offerId: data.id,
      listingId: data.listingId,
      buyerId: data.buyerId,
      sellerId: data.sellerId || null,
      orderNumber,
      totalAmount: data.totalPrice,
      freightAmount: data.freightPrice || 0,
      platformFee: Number(data.totalPrice) * 0.025,
      status: 'pending_payment',
    });
  }

  return NextResponse.json(data);
}
