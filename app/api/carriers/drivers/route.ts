import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getOwnerCarrierId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('carriers')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

// POST /api/carriers/drivers  — add a driver
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const carrierId = await getOwnerCarrierId(supabase, user.id);
  if (!carrierId) return NextResponse.json({ error: 'No carrier profile' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? body.full_name ?? '').trim();
  if (!fullName) return NextResponse.json({ error: 'full_name is required' }, { status: 400 });

  const row = {
    carrier_id: carrierId,
    full_name: fullName,
    phone: body.phone ?? null,
    email: body.email ?? null,
    licence_number: body.licenceNumber ?? body.licence_number ?? null,
    licence_class: body.licenceClass ?? body.licence_class ?? null,
    licence_expiry: body.licenceExpiry ?? body.licence_expiry ?? null,
    active: body.active ?? true,
  };

  const { data, error } = await supabase.from('carrier_drivers').insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ driver: data }, { status: 201 });
}

// GET /api/carriers/drivers
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const carrierId = await getOwnerCarrierId(supabase, user.id);
  if (!carrierId) return NextResponse.json({ drivers: [] });

  const { data, error } = await supabase
    .from('carrier_drivers')
    .select('*')
    .eq('carrier_id', carrierId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drivers: data ?? [] });
}
