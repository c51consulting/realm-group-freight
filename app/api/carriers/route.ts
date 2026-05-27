import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/carriers  — create the carrier profile for the current user (one per user)
// PATCH /api/carriers — update the current user's carrier profile
// GET /api/carriers   — list active carriers (public discovery)

const CAMEL_TO_SNAKE: Record<string, string> = {
  businessName: 'business_name',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
  baseAddress: 'base_address',
  gstRegistered: 'gst_registered',
  nhvrAccreditation: 'nhvr_accreditation',
  insuranceProvider: 'insurance_provider',
  insurancePolicyNumber: 'insurance_policy_number',
  insuranceExpiry: 'insurance_expiry',
  insuranceDocUrl: 'insurance_doc_url',
  fleetSize: 'fleet_size',
  regionsServed: 'regions_served',
  commoditiesHandled: 'commodities_handled',
};

const ALLOWED_DB_COLUMNS = new Set([
  'business_name','abn','contact_phone','contact_email','base_address','gst_registered',
  'nhvr_accreditation','insurance_provider','insurance_policy_number','insurance_expiry',
  'insurance_doc_url','fleet_size','regions_served','commodities_handled',
]);

function toDbRow(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    const dbKey = CAMEL_TO_SNAKE[k] ?? k;
    if (ALLOWED_DB_COLUMNS.has(dbKey)) out[dbKey] = v;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'active';
  const region = searchParams.get('region');

  let query = supabase
    .from('carriers')
    .select('id, business_name, regions_served, commodities_handled, fleet_size, rating, review_count, status')
    .eq('status', status)
    .order('rating', { ascending: false });

  if (region) query = query.contains('regions_served', [region]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carriers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const row = toDbRow(body);
  if (!row.business_name) {
    return NextResponse.json({ error: 'business_name is required' }, { status: 400 });
  }

  // Ensure users.role = 'carrier' (upsert into users table — works even if profile row missing)
  await supabase.from('users').upsert(
    { id: user.id, email: user.email ?? '', role: 'carrier' },
    { onConflict: 'id' }
  );

  // Insert carrier row; UNIQUE on owner_id means duplicate POSTs will error — caller should use PATCH after.
  const insertRow = { ...row, owner_id: user.id, status: 'pending_review' as const };
  const { data, error } = await supabase
    .from('carriers')
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    // Unique violation — already onboarded
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Carrier profile already exists for this user. Use PATCH to update.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ carrier: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const row = toDbRow(body);
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'No updatable fields supplied' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('carriers')
    .update(row)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carrier: data });
}
