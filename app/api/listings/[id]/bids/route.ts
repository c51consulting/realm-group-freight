import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/listings/:id/bids — public bid history (amounts + masked bidder ids)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: listing, error: lerr } = await supabase
    .from('listings')
    .select('id, listing_mode, auction_status')
    .eq('id', params.id)
    .single();
  if (lerr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.listing_mode !== 'auction') {
    return NextResponse.json({ error: 'Listing is not an auction' }, { status: 400 });
  }

  const { data: bids, error } = await supabase
    .from('bids')
    .select('id, amount, bidder_id, is_winning, is_buy_now, created_at')
    .eq('listing_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mask bidder ids (privacy): show only last 4 chars
  const masked = (bids || []).map((b) => ({
    ...b,
    bidder_id: undefined,
    bidder_alias: 'bidder_' + (b.bidder_id || '').slice(-4),
  }));

  return NextResponse.json({ bids: masked });
}

// POST /api/listings/:id/bids — place a bid
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const amount = Number(body?.amount);
  if (!isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }

  // Ensure public users row exists for FK
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  // Trigger enforces all the business rules (window, increment, seller-can't-bid, etc.)
  const { data, error } = await supabase
    .from('bids')
    .insert({ listing_id: params.id, bidder_id: user.id, amount })
    .select()
    .single();

  if (error) {
    // Surface trigger errors cleanly
    const msg = error.message || 'Bid rejected';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ bid: data }, { status: 201 });
}
