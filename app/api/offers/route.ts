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
  const selectClause = `
    *,
    listing:listings!listing_id(id, title, material_type, pickup_address, seller_id),
    buyer:users!buyer_id(id, business_name)
  `;

  let buyerQuery = supabase
    .from('offers')
    .select(selectClause)
    .eq('buyer_id', user.id);

  if (listingId) buyerQuery = buyerQuery.eq('listing_id', listingId);
  if (status) buyerQuery = buyerQuery.eq('status', status);

  const { data: sellerListings, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('seller_id', user.id);

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });

  const sellerListingIds = (sellerListings || []).map((item: { id: string }) => item.id);
  let sellerOffers: any[] = [];
  if (sellerListingIds.length > 0) {
    let sellerQuery = supabase
      .from('offers')
      .select(selectClause)
      .in('listing_id', sellerListingIds);

    if (listingId) sellerQuery = sellerQuery.eq('listing_id', listingId);
    if (status) sellerQuery = sellerQuery.eq('status', status);

    const { data, error } = await sellerQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    sellerOffers = data || [];
  }

  const { data: buyerOffers, error: buyerError } = await buyerQuery;
  if (buyerError) return NextResponse.json({ error: buyerError.message }, { status: 500 });

  const offersById = new Map<string, any>();
  [...(buyerOffers || []), ...sellerOffers].forEach((offer) => offersById.set(offer.id, offer));
  const offers = [...offersById.values()].sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return NextResponse.json({ offers });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  // Ensure buyer has a users row
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  const validation = validateOffer({
    listingId: body.listing_id || body.listingId,
    pricePerUnit: body.price_per_unit || body.pricePerUnit,
    quantity: body.quantity,
  });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', body.listing_id || body.listingId)
    .single();

  if (listingError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.seller_id === user.id) return NextResponse.json({ error: 'You cannot make an offer on your own listing' }, { status: 400 });
  if (listing.status !== 'active') return NextResponse.json({ error: 'This listing is not accepting offers' }, { status: 400 });

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

  const { data: existing, error: existingError } = await supabase
    .from('offers')
    .select('*, listing:listings!listing_id(id, seller_id)')
    .eq('id', id)
    .single();

  if (existingError || !existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending offers can be actioned' }, { status: 400 });

  const isBuyer = existing.buyer_id === user.id;
  const isSeller = existing.listing?.seller_id === user.id;
  if (action === 'withdraw' && !isBuyer) {
    return NextResponse.json({ error: 'Only the buyer can withdraw this offer' }, { status: 403 });
  }
  if ((action === 'accept' || action === 'reject') && !isSeller) {
    return NextResponse.json({ error: 'Only the seller can accept or reject this offer' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('offers')
    .update({ status: statusMap[action] })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If accepted, create an order
  if (action === 'accept' && data) {
    const orderNumber = `RM-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from('orders').insert({
      offer_id: data.id,
      listing_id: data.listing_id,
      buyer_id: data.buyer_id,
      seller_id: existing.listing?.seller_id || null,
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
