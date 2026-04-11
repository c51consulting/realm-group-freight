import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { validateListing } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const materialType = searchParams.get('materialType');
  const type = searchParams.get('type');
  const status = searchParams.get('status') || 'active';
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  let query = supabase
    .from('listings')
    .select('*, seller:users!sellerId(id, businessName, rating, reviewCount)', { count: 'exact' })
    .eq('status', status);

  if (materialType) query = query.eq('materialType', materialType);
  if (type) query = query.eq('type', type);
  if (search) query = query.ilike('title', `%${search}%`);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    listings: data,
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  // Validate
  const validation = validateListing(body);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...body,
      sellerId: user.id,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
