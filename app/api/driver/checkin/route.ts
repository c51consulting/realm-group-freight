import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function num(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const orderId = body?.order_id;
  if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

  const stage = body?.stage;
  if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 });

  const row: Record<string, any> = {
    order_id: orderId,
    driver_user_id: user.id,
    stage,
    vehicle_rego: body.vehicle_rego ?? null,
    trailer_rego: body.trailer_rego ?? null,
    abn: body.abn ?? null,
    odometer_km: num(body.odometer_km),
    seal_number: body.seal_number ?? null,
    photo_paths: Array.isArray(body.photo_paths) ? body.photo_paths : [],
    lat: num(body.lat),
    lng: num(body.lng),
    notes: body.notes ?? null,
  };

  const { data, error } = await supabase.from('driver_checkins').insert(row).select('id').single();
  if (error) return NextResponse.json({ error: 'Insert failed', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, checkin_id: data.id });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get('order_id');
  if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });
  const { data, error } = await supabase
    .from('driver_checkins')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checkins: data ?? [] });
}
