import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(['pending_review', 'active', 'suspended', 'rejected']);

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', code: 401 } as const;
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (u?.role !== 'admin') return { error: 'Forbidden', code: 403 } as const;
  return { user } as const;
}

// PATCH /api/admin/carriers/[id]
// body: { status: 'active'|'suspended'|'rejected'|'pending_review', rejectionReason?: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.code });

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid carrier id' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const row: Record<string, any> = {
    status,
    reviewed_by: auth.user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (status === 'rejected' || status === 'suspended') {
    row.rejection_reason = body.rejectionReason ?? body.rejection_reason ?? null;
  }

  const { data, error } = await supabase
    .from('carriers')
    .update(row)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carrier: data });
}

// GET /api/admin/carriers/[id]  — full detail incl. vehicles + drivers
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.code });

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid carrier id' }, { status: 400 });
  }

  const { data: carrier, error } = await supabase
    .from('carriers')
    .select('*, owner:users!owner_id(id, email, business_name, phone, created_at)')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!carrier) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [vehiclesRes, driversRes] = await Promise.all([
    supabase.from('carrier_vehicles').select('*').eq('carrier_id', carrier.id).order('created_at'),
    supabase.from('carrier_drivers').select('*').eq('carrier_id', carrier.id).order('created_at'),
  ]);

  // Signed URL for insurance doc if present
  let insuranceSignedUrl: string | null = null;
  if (carrier.insurance_doc_url) {
    const { data: signed } = await supabase.storage
      .from('carrier-docs')
      .createSignedUrl(carrier.insurance_doc_url, 60 * 60);
    insuranceSignedUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    carrier,
    vehicles: vehiclesRes.data ?? [],
    drivers: driversRes.data ?? [],
    insuranceSignedUrl,
  });
}
