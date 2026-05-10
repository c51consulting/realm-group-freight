import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOffer } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id') || searchParams.get('listingId');
  const status = searchParams.get('status');

  let query = supabase
    .from('offers')
    .select(`
      *,
      listing:listings!listing_id(id, title, material_type, pickup_address),
      buyer:users!buyer_id(id, business_name)
    `);

  // Show offers where user is buyer OR seller
  query = query.or(`buyer_id.eq.${user.id},listing.seller_id.eq.${user.id}`).filter('buyer_id', 'eq', user.id);

  if (listingId) query = query.eq('listing_id', listingId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offers: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  // Ensure buyer has a users row
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  const totalPrice = Number(body.price_per_unit || body.pricePerUnit || 0) * Number(body.quantity || 0)
    + Number(body.freight_price || body.freightPrice || 0);

  const { data, error } = await supabase
    .from('offers')
    .insert({
      listing_id: body.listing_id || body.listingId,
      buyer_id: user.id,
      price_per_unit: Number(body.price_per_unit || body.pricePerUnit || 0),
      quantity: Number(body.quantity || 0),
      total_price: totalPrice,
      freight_included: Boolean(body.freight_included ?? body.freightIncluded ?? false),
      freight_price: Number(body.freight_price || body.freightPrice || 0),
      message: body.message || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const { offerId, offer_id, action } = body;
  const id = offerId || offer_id;

  if (!id || !['accept', 'reject', 'withdraw'].includes(action)) {
    return NextResponse.json({ error: 'Invalid offer ID or action' }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    accept: 'accepted',
    reject: 'rejected',
    withdraw: 'withdrawn',
  };

  const { data, error } = await supabase
    .from('offers')
    .update({ status: statusMap[action] })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If accepted, create an order
  if (action === 'accept' && data) {
    const orderNumber = `RM-${Date.now().toString(36).toUpperCase()}`;
    const listing = await supabase.from('listings').select('seller_id').eq('id', data.listing_id).single();
    await supabase.from('orders').insert({
      offer_id: data.id,
      listing_id: data.listing_id,
      buyer_id: data.buyer_id,
      seller_id: listing.data?.seller_id || null,
      order_number: orderNumber,
      total_amount: data.total_price,
      freight_amount: data.freight_price || 0,
      platform_fee: Number(data.total_price) * 0.05,
      payment_held: false,
      status: 'pending_payment',
    });
  }

  return NextResponse.json(data);
}
