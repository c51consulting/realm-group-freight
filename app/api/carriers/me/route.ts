import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/carriers/me — current user's carrier profile (+ vehicles + drivers). 404 if none.
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: carrier, error } = await supabase
    .from('carriers')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!carrier) return NextResponse.json({ error: 'No carrier profile' }, { status: 404 });

  const [vehiclesRes, driversRes] = await Promise.all([
    supabase.from('carrier_vehicles').select('*').eq('carrier_id', carrier.id).order('created_at', { ascending: true }),
    supabase.from('carrier_drivers').select('*').eq('carrier_id', carrier.id).order('created_at', { ascending: true }),
  ]);

  return NextResponse.json({
    carrier,
    vehicles: vehiclesRes.data ?? [],
    drivers: driversRes.data ?? [],
  });
}
