import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function sha256Hex(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function num(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-device-key');
  if (!apiKey) return NextResponse.json({ error: 'Missing X-Device-Key' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body?.vehicle_rego) return NextResponse.json({ error: 'vehicle_rego is required' }, { status: 400 });

  const supabase = adminClient();
  const keyHash = sha256Hex(apiKey);

  const { data: device, error: deviceErr } = await supabase
    .from('weighbridge_devices')
    .select('id, weighbridge_id, status')
    .eq('api_key_hash', keyHash)
    .maybeSingle();
  if (deviceErr) return NextResponse.json({ error: 'Auth lookup failed', detail: deviceErr.message }, { status: 500 });
  if (!device || device.status !== 'active') return NextResponse.json({ error: 'Invalid or inactive device key' }, { status: 401 });

  const weighbridgeId = body.weighbridge_id || device.weighbridge_id;
  const grossKg = num(body.gross_kg);
  const tareKg = num(body.tare_kg);
  const netKg = num(body.net_kg) ?? (grossKg !== null && tareKg !== null ? grossKg - tareKg : null);

  const ticketRow: Record<string, any> = {
    weighbridge_id: weighbridgeId,
    device_id: device.id,
    ticket_number: body.ticket_number ?? null,
    vehicle_rego: String(body.vehicle_rego).toUpperCase().trim(),
    trailer_rego: body.trailer_rego ? String(body.trailer_rego).toUpperCase().trim() : null,
    driver_name: body.driver_name ?? null,
    carrier_name: body.carrier_name ?? null,
    gross_kg: grossKg,
    tare_kg: tareKg,
    net_kg: netKg,
    moisture_pct: num(body.moisture_pct),
    commodity_code: body.commodity_code ?? null,
    recorded_at: body.recorded_at ? new Date(body.recorded_at).toISOString() : new Date().toISOString(),
    lat: num(body.lat),
    lng: num(body.lng),
    source: 'webhook',
    raw_payload: body,
  };

  const { data: ticket, error: ticketErr } = await supabase
    .from('weighbridge_tickets')
    .insert(ticketRow)
    .select('id')
    .single();
  if (ticketErr || !ticket) return NextResponse.json({ error: 'Ticket insert failed', detail: ticketErr?.message }, { status: 500 });

  await supabase.from('weighbridge_devices').update({ last_seen_at: new Date().toISOString() }).eq('id', device.id);

  let matchedOrderId: string | null = null;
  let matchedBy: 'auto' | 'manual' = 'auto';
  let confidence = 0;
  if (body.order_id) {
    matchedOrderId = String(body.order_id);
    matchedBy = 'manual';
    confidence = 1.0;
  } else {
    const { data: matches } = await supabase
      .from('orders')
      .select('id, carrier_id, status, listing_id, contract_terms')
      .in('status', ['accepted', 'in_transit', 'loading', 'unloading', 'pending'])
      .order('created_at', { ascending: false })
      .limit(50);
    const rego = ticketRow.vehicle_rego;
    const candidate = (matches || []).find((o: any) => {
      const ct = (o.contract_terms || {}) as Record<string, any>;
      const regos: string[] = (ct.vehicle_regos || []).map((r: string) => String(r).toUpperCase());
      return regos.includes(rego);
    });
    if (candidate) { matchedOrderId = candidate.id; confidence = 0.85; }
  }

  let variancePct: number | null = null;
  let listingId: string | null = null;
  let flagged = false;
  if (matchedOrderId) {
    const { data: ord } = await supabase.from('orders').select('id, listing_id').eq('id', matchedOrderId).maybeSingle();
    if (ord?.listing_id) {
      listingId = ord.listing_id;
      const { data: listing } = await supabase
        .from('listings')
        .select('quantity_available, unit_type, estimated_weight_per_unit')
        .eq('id', ord.listing_id)
        .maybeSingle();
      if (listing && netKg) {
        let expectedKg: number | null = null;
        if (listing.unit_type === 'kg') expectedKg = Number(listing.quantity_available);
        else if (listing.unit_type === 'tonne') expectedKg = Number(listing.quantity_available) * 1000;
        else if (listing.estimated_weight_per_unit) expectedKg = Number(listing.quantity_available) * Number(listing.estimated_weight_per_unit);
        if (expectedKg && expectedKg > 0) {
          variancePct = ((netKg - expectedKg) / expectedKg) * 100;
          if (Math.abs(variancePct) > 2) flagged = true;
        }
      }
    }
  }

  let linkedEventId: string | null = null;
  if (matchedOrderId) {
    const direction = body.direction && ['inbound','outbound','loaded','unloaded'].includes(body.direction) ? body.direction : null;
    const { data: ev, error: evErr } = await supabase
      .from('order_weighbridge_events')
      .insert({ order_id: matchedOrderId, listing_id: listingId, ticket_id: ticket.id, direction, matched_by: matchedBy, confidence, variance_pct: variancePct, flagged })
      .select('id')
      .single();
    if (!evErr) linkedEventId = ev?.id ?? null;
  }

  return NextResponse.json({ ok: true, ticket_id: ticket.id, linked_event_id: linkedEventId, matched_order_id: matchedOrderId, variance_pct: variancePct, flagged });
}

export async function GET() {
  return NextResponse.json({ service: 'REALM Weighbridge Ingest', method: 'POST', auth: 'X-Device-Key header', required_fields: ['vehicle_rego'] });
}
