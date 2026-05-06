// /api/weighbridge/ingest/zapier
//
// Friendly adapter endpoint for low-code tools (Zapier, Make.com, n8n, IFTTT,
// Power Automate). Accepts flat key/value JSON or form-encoded payloads,
// normalises them, and forwards to the canonical /api/weighbridge/ingest
// handler logic.
//
// Auth: device key may be supplied via header (x-device-key, x-api-key,
// authorization: Bearer ...) OR body field (device_key | apiKey | token).
//
// Field aliasing supports the most common naming conventions used by
// telematics and weighbridge software exporters.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function pick(obj: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    const lk = k.toLowerCase();
    for (const ok of Object.keys(obj)) {
      if (ok.toLowerCase() === lk && obj[ok] !== undefined && obj[ok] !== null && obj[ok] !== '') {
        return obj[ok];
      }
    }
  }
  return undefined;
}

function toKg(value: any, unitHint?: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[, ]/g, ''));
  if (!Number.isFinite(n)) return undefined;
  const u = (unitHint || '').toString().toLowerCase();
  if (u === 't' || u === 'tonne' || u === 'tonnes' || u === 'mt') return Math.round(n * 1000);
  if (u === 'lb' || u === 'lbs') return Math.round(n * 0.453592);
  if (u === 'g') return Math.round(n / 1000);
  return Math.round(n);
}

async function readBody(req: NextRequest): Promise<Record<string, any>> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await req.json(); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    fd.forEach((v, k) => { obj[k] = typeof v === 'string' ? v : ''; });
    return obj;
  }
  // last resort
  try { return await req.json(); } catch { return {}; }
}

export async function POST(req: NextRequest) {
  const body = await readBody(req);

  const headerKey =
    req.headers.get('x-device-key') ||
    req.headers.get('x-api-key') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
    undefined;

  const deviceKey = headerKey || pick(body, ['device_key', 'deviceKey', 'apiKey', 'api_key', 'token']);
  if (!deviceKey) {
    return NextResponse.json({ error: 'Missing device key' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, serviceKey);

  // Verify device key
  const { data: device, error: devErr } = await supabase
    .from('weighbridge_devices')
    .select('id, weighbridge_id, active')
    .eq('device_key', deviceKey)
    .maybeSingle();
  if (devErr || !device || !device.active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const unit = pick(body, ['unit', 'weight_unit', 'uom']);
  const gross = toKg(pick(body, ['gross_kg', 'gross', 'gross_weight', 'grossWeightKg', 'weight', 'kg']), unit);
  const tare = toKg(pick(body, ['tare_kg', 'tare', 'tare_weight']), unit);
  const net = toKg(pick(body, ['net_kg', 'net', 'net_weight']), unit);

  const reading = {
    weighbridge_id: device.weighbridge_id,
    device_id: device.id,
    order_id: pick(body, ['order_id', 'orderId', 'order']) || null,
    vehicle_rego: pick(body, ['vehicle_rego', 'rego', 'vehicle', 'plate', 'licence_plate', 'license_plate']) || null,
    trailer_rego: pick(body, ['trailer_rego', 'trailer', 'trailer_plate']) || null,
    direction: (pick(body, ['direction', 'movement']) || 'in').toString().toLowerCase().startsWith('o') ? 'out' : 'in',
    gross_kg: gross ?? null,
    tare_kg: tare ?? null,
    net_kg: net ?? (gross && tare ? gross - tare : null),
    ticket_number: pick(body, ['ticket_number', 'ticket', 'docket', 'docket_number']) || null,
    lat: pick(body, ['lat', 'latitude']) ?? null,
    lng: pick(body, ['lng', 'lon', 'longitude']) ?? null,
    captured_at: pick(body, ['captured_at', 'timestamp', 'time', 'datetime']) || new Date().toISOString(),
    source: pick(body, ['source']) || 'zapier-adapter',
    raw_payload: body,
  };

  if (reading.gross_kg === null && reading.net_kg === null) {
    return NextResponse.json({ error: 'Missing weight (gross_kg or net_kg)' }, { status: 400 });
  }

  const { data: inserted, error: insErr } = await supabase
    .from('weighbridge_readings')
    .insert(reading)
    .select('id')
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: 'POST flat JSON or form-encoded payload with device key in header (x-device-key) or body (device_key). Aliased fields supported: weight, gross_weight, vehicle/rego/plate, ticket/docket, timestamp, etc.',
  });
}
