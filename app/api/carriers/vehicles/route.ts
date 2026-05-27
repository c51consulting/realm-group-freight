import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_VEHICLE_TYPES = new Set([
  'rigid','semi','b_double','b_triple','road_train','ute','tipper','livestock_crate','flatbed','other',
]);

async function getOwnerCarrierId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('carriers')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

// POST /api/carriers/vehicles  — add a vehicle to the current user's carrier
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const carrierId = await getOwnerCarrierId(supabase, user.id);
  if (!carrierId) {
    return NextResponse.json({ error: 'No carrier profile. Create one first.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const rego = String(body.rego ?? '').trim().toUpperCase();
  const vehicleType = String(body.vehicleType ?? body.vehicle_type ?? '').trim();
  if (!rego) return NextResponse.json({ error: 'rego is required' }, { status: 400 });
  if (!ALLOWED_VEHICLE_TYPES.has(vehicleType)) {
    return NextResponse.json({ error: 'Invalid vehicle_type' }, { status: 400 });
  }

  const row = {
    carrier_id: carrierId,
    rego,
    vehicle_type: vehicleType,
    capacity_tonnes: body.capacityTonnes ?? body.capacity_tonnes ?? null,
    make: body.make ?? null,
    model: body.model ?? null,
    year: body.year ?? null,
    active: body.active ?? true,
  };

  const { data, error } = await supabase.from('carrier_vehicles').insert(row).select().single();
  if (error) {
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Vehicle with this rego already exists for your carrier' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ vehicle: data }, { status: 201 });
}

// GET /api/carriers/vehicles — list current user's vehicles
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const carrierId = await getOwnerCarrierId(supabase, user.id);
  if (!carrierId) return NextResponse.json({ vehicles: [] });

  const { data, error } = await supabase
    .from('carrier_vehicles')
    .select('*')
    .eq('carrier_id', carrierId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vehicles: data ?? [] });
}
