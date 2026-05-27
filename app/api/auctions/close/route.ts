import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auctions/close
// Closes any auctions whose auction_ends_at <= now. For each:
//   - If a high bidder exists AND (no reserve OR current_bid >= reserve): mark ended_sold + create order.
//   - Otherwise: mark ended_no_sale and reset listing.status to 'expired'.
// Designed to be invoked by a Railway cron (or hit manually as admin) every 1–5 minutes.
// Idempotent: only operates on auctions still in 'scheduled' or 'live'.
//
// Auth: requires either (a) admin user, or (b) header x-cron-secret matching env CRON_SECRET.
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth gate
  const headerSecret = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  let authorised = false;

  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    authorised = true;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (u?.role === 'admin') authorised = true;
    }
  }
  if (!authorised) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const nowIso = new Date().toISOString();

  // Find auctions that have ended and are still open
  const { data: due, error } = await supabase
    .from('listings')
    .select('id, seller_id, auction_current_bid, auction_high_bidder_id, auction_reserve_price, auction_ends_at')
    .eq('listing_mode', 'auction')
    .in('auction_status', ['scheduled', 'live'])
    .lte('auction_ends_at', nowIso);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Array<{ id: string; outcome: string; order_id?: string; error?: string }> = [];

  for (const a of due || []) {
    try {
      const hasBid = a.auction_current_bid != null && a.auction_high_bidder_id;
      const reserveMet = !a.auction_reserve_price || (a.auction_current_bid != null && Number(a.auction_current_bid) >= Number(a.auction_reserve_price));

      if (hasBid && reserveMet) {
        // Sold — create order
        const orderNumber = `RM-${Date.now().toString(36).toUpperCase()}-${a.id.slice(0, 4)}`;
        const total = Number(a.auction_current_bid);
        const { data: order, error: oerr } = await supabase.from('orders').insert({
          listing_id: a.id,
          buyer_id: a.auction_high_bidder_id,
          seller_id: a.seller_id,
          order_number: orderNumber,
          total_amount: total,
          freight_amount: 0,
          platform_fee: Number((total * 0.05).toFixed(2)),
          payment_held: false,
          status: 'pending_payment',
        }).select().single();

        if (oerr) {
          results.push({ id: a.id, outcome: 'order_failed', error: oerr.message });
          continue;
        }

        await supabase.from('listings').update({
          auction_status: 'ended_sold',
          auction_winner_id: a.auction_high_bidder_id,
          auction_winning_bid: total,
          auction_closed_at: nowIso,
          auction_order_id: order.id,
          status: 'sold',
        }).eq('id', a.id);

        results.push({ id: a.id, outcome: 'sold', order_id: order.id });
      } else {
        // No sale (no bids or reserve not met)
        await supabase.from('listings').update({
          auction_status: 'ended_no_sale',
          auction_closed_at: nowIso,
          status: 'expired',
        }).eq('id', a.id);
        results.push({ id: a.id, outcome: 'no_sale' });
      }
    } catch (err: any) {
      results.push({ id: a.id, outcome: 'error', error: err?.message || String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// GET — manual peek for debugging
export async function GET(req: NextRequest) {
  return POST(req);
}
