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

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = service();
  const { data, error } = await sb.from('weighbridges').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ weighbridges: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({} as any));
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const sb = service();
  const insert = {
    name: body.name,
    operator: body.operator ?? null,
    address: body.address ?? null,
    state: body.state ?? null,
    postcode: body.postcode ?? null,
  };
  const { data, error } = await sb.from('weighbridges').insert(insert).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ weighbridge: data });
}
