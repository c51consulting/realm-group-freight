import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function requireAdmin(req: NextRequest): boolean {
  const k = req.headers.get('x-admin-key');
  return !!k && !!process.env.ADMIN_API_KEY && k === process.env.ADMIN_API_KEY;
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = service();
  const wid = new URL(req.url).searchParams.get('weighbridge_id');
  let q = sb.from('weighbridge_devices').select('id, weighbridge_id, device_serial, device_label, status, last_seen_at, created_at').order('created_at', { ascending: false });
  if (wid) q = q.eq('weighbridge_id', wid);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ devices: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({} as any));
  if (!body.weighbridge_id) return NextResponse.json({ error: 'weighbridge_id required' }, { status: 400 });
  const apiKey = 'wb_' + crypto.randomBytes(24).toString('hex');
  const row = {
    weighbridge_id: body.weighbridge_id,
    device_serial: body.device_serial ?? null,
    device_label: body.device_label ?? null,
    api_key_hash: sha256(apiKey),
    status: 'active',
  };
  const sb = service();
  const { data, error } = await sb.from('weighbridge_devices').insert(row).select('id, weighbridge_id, device_serial, device_label, status, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ device: data, api_key: apiKey, note: 'Store api_key now. It will not be shown again.' });
}
