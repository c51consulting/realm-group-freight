import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/orders/[id]/claim
// body: { freightAmount?: number }
// Sets orders.carrier_id = current user's user id IFF the user owns an ACTIVE carrier profile
// and the order is currently unclaimed and in a claimable status (paid).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = params.id;
  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  // Verify caller has an active carrier profile
  const { data: carrier, error: carrierErr } = await supabase
    .from('carriers')
    .select('id, status, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (carrierErr) return NextResponse.json({ error: carrierErr.message }, { status: 500 });
  if (!carrier) return NextResponse.json({ error: 'No carrier profile' }, { status: 403 });
  if (carrier.status !== 'active') {
    return NextResponse.json({ error: `Carrier status is ${carrier.status}. Must be active to claim loads.` }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const freightAmount = body.freightAmount ?? body.freight_amount ?? null;

  // Atomic claim: only update if currently unclaimed and in paid status
  const updateRow: Record<string, any> = {
    carrier_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (freightAmount !== null && freightAmount !== undefined) {
    const n = Number(freightAmount);
    if (Number.isFinite(n) && n >= 0) updateRow.freight_amount = n;
  }

  const { data: claimed, error: claimErr } = await supabase
    .from('orders')
    .update(updateRow)
    .eq('id', orderId)
    .is('carrier_id', null)
    .eq('status', 'paid')
    .select()
    .maybeSingle();

  if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
  if (!claimed) {
    // Diagnose why
    const { data: o } = await supabase
      .from('orders')
      .select('id, status, carrier_id')
      .eq('id', orderId)
      .maybeSingle();
    if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (o.carrier_id) return NextResponse.json({ error: 'Order already claimed' }, { status: 409 });
    return NextResponse.json({ error: `Order status is ${o.status}; only paid orders can be claimed` }, { status: 409 });
  }

  return NextResponse.json({ order: claimed });
}
