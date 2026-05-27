import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', code: 401 } as const;
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (u?.role !== 'admin') return { error: 'Forbidden', code: 403 } as const;
  return { user } as const;
}

// GET /api/admin/carriers?status=pending_review
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.code });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('carriers')
    .select('*, owner:users!owner_id(id, email, business_name, phone)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carriers: data ?? [] });
}
