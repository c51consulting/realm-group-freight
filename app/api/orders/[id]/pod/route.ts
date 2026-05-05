import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function num(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orderId = params.id;
  if (!orderId) return NextResponse.json({ error: 'order id required' }, { status: 400 });
  const body = await req.json().catch(() => ({} as any));
  const row = {
    order_id: orderId,
    driver_user_id: user.id,
    recipient_name: body.recipient_name ?? null,
    signature_url: body.signature_url ?? null,
    photo_paths: Array.isArray(body.photo_paths) ? body.photo_paths : [],
    delivered_lat: num(body.lat),
    delivered_lng: num(body.lng),
    notes: body.notes ?? null,
  };
  const { data, error } = await supabase.from('proof_of_delivery').insert(row).select('id').single();
  if (error) return NextResponse.json({ error: 'Insert failed', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pod_id: data.id });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('proof_of_delivery')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pod: data ?? [] });
}
