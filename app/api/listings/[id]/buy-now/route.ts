import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/listings/:id/buy-now — ends an auction immediately at the buy-now price
// and creates a pending_payment order for the buyer.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  // Atomically claim the auction: only succeed if still live and buy_now is set
  const nowIso = new Date().toISOString();

  // First read it (we need seller_id + buy_now_price)
  const { data: listing, error: lerr } = await supabase
    .from('listings')
    .select('id, seller_id, listing_mode, auction_status, auction_buy_now_price, auction_ends_at')
    .eq('id', params.id)
    .single();
  if (lerr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  if (listing.listing_mode !== 'auction') {
    return NextResponse.json({ error: 'Listing is not an auction' }, { status: 400 });
  }
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'Seller cannot buy own auction' }, { status: 400 });
  }
  if (!listing.auction_buy_now_price) {
    return NextResponse.json({ error: 'No buy-now price set for this auction' }, { status: 400 });
  }
  if (listing.auction_ends_at && new Date(listing.auction_ends_at) <= new Date()) {
    return NextResponse.json({ error: 'Auction has already ended' }, { status: 400 });
  }
  if (!['scheduled', 'live'].includes(listing.auction_status || '')) {
    return NextResponse.json({ error: 'Auction is not open' }, { status: 400 });
  }

  const buyNowPrice = Number(listing.auction_buy_now_price);

  // Conditional update: only flip to ended_sold if still scheduled/live
  const { data: claim, error: cerr } = await supabase
    .from('listings')
    .update({
      auction_status: 'ended_sold',
      auction_winner_id: user.id,
      auction_winning_bid: buyNowPrice,
      auction_current_bid: buyNowPrice,
      auction_high_bidder_id: user.id,
      auction_closed_at: nowIso,
      status: 'sold',
    })
    .eq('id', params.id)
    .in('auction_status', ['scheduled', 'live'])
    .select()
    .single();

  if (cerr || !claim) {
    return NextResponse.json({ error: 'Buy-now no longer available' }, { status: 409 });
  }

  // Record the buy-now as a winning bid (skip trigger by direct insert path is fine —
  // trigger will run, but listing is already ended_sold which fails the check.
  // So we insert via a service-style direct write: use bids without trigger by toggling status briefly is risky.
  // Simpler: insert is_buy_now bid by temporarily relying on the trigger having flipped status.
  // Cleanest path: don't run the trigger for buy-now — we mark it manually.
  // Workaround: insert the bid BEFORE flipping status would race. Since trigger blocks ended_sold,
  // we'll skip the bids row for buy-now and rely on listing.auction_winning_bid as truth.

  // Create order
  const orderNumber = `RM-${Date.now().toString(36).toUpperCase()}`;
  const { data: order, error: oerr } = await supabase.from('orders').insert({
    listing_id: claim.id,
    buyer_id: user.id,
    seller_id: claim.seller_id,
    order_number: orderNumber,
    total_amount: buyNowPrice,
    freight_amount: 0,
    platform_fee: Number((buyNowPrice * 0.05).toFixed(2)),
    payment_held: false,
    status: 'pending_payment',
  }).select().single();

  if (oerr) {
    return NextResponse.json({ error: 'Auction closed but order creation failed: ' + oerr.message }, { status: 500 });
  }

  // Link order back to listing
  await supabase.from('listings').update({ auction_order_id: order.id }).eq('id', claim.id);

  return NextResponse.json({ order, listing: claim }, { status: 201 });
}
