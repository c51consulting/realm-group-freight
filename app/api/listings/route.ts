import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateListing } from '@/lib/validation';

// Map camelCase keys from clients/validators to snake_case DB columns
const CAMEL_TO_SNAKE: Record<string, string> = {
  materialType: 'material_type',
  materialSubtype: 'material_subtype',
  unitType: 'unit_type',
  unitLabel: 'unit_label',
  pricePerUnit: 'price_per_unit',
  pricePerTonneEquiv: 'price_per_tonne_equiv',
  quantityAvailable: 'quantity_available',
  quantityUnit: 'quantity_unit',
  minimumOrder: 'minimum_order',
  estimatedWeightPerUnit: 'estimated_weight_per_unit',
  pricingType: 'pricing_type',
  freightIncluded: 'freight_included',
  deliveryRadius: 'delivery_radius',
  pickupAddress: 'pickup_address',
  pickupLat: 'pickup_lat',
  pickupLng: 'pickup_lng',
  loadingAvailable: 'loading_available',
  qualityLevel: 'quality_level',
  expiresAt: 'expires_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sellerId: 'seller_id',
  listingMode: 'listing_mode',
  auctionStartsAt: 'auction_starts_at',
  auctionEndsAt: 'auction_ends_at',
  auctionStartingPrice: 'auction_starting_price',
  auctionReservePrice: 'auction_reserve_price',
  auctionBuyNowPrice: 'auction_buy_now_price',
  auctionIncrement: 'auction_increment',
};

const ALLOWED_DB_COLUMNS = new Set([
  'seller_id','type','status','material_type','material_subtype','title','description',
  'unit_type','unit_label','price_per_unit','price_per_tonne_equiv','quantity_available',
  'quantity_unit','minimum_order','estimated_weight_per_unit','pricing_type','freight_included',
  'delivery_radius','pickup_address','pickup_lat','pickup_lng','loading_available','images',
  'quality_level','expires_at',
  'listing_mode','auction_starts_at','auction_ends_at','auction_starting_price',
  'auction_reserve_price','auction_buy_now_price','auction_increment','auction_status',
]);

function toDbRow(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    const dbKey = CAMEL_TO_SNAKE[k] ?? k;
    if (ALLOWED_DB_COLUMNS.has(dbKey)) out[dbKey] = v;
  }
  return out;
}

function mapSortBy(sortBy: string): string {
  return CAMEL_TO_SNAKE[sortBy] ?? sortBy;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
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
    .select('*, seller:users!seller_id(id, business_name, rating, review_count)', { count: 'exact' })
    .eq('status', status);

  if (materialType) query = query.eq('material_type', materialType);
  if (type) query = query.eq('type', type);
  if (search) query = query.ilike('title', `%${search}%`);

  query = query
    .order(mapSortBy(sortBy), { ascending: sortOrder === 'asc' })
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
  const supabase = await createClient();
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
  
  // Ensure a public users row exists for this auth user (FK target)
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  // For auction-mode listings, seed status to 'scheduled' and apply increment default
  const isAuction = body?.listingMode === 'auction';
  const extras: Record<string, any> = { sellerId: user.id, status: 'active' };
  if (isAuction) {
    extras.auction_status = 'scheduled';
    if (body.auctionIncrement == null) extras.auctionIncrement = 10;
  }
  const row = toDbRow({ ...body, ...extras });

  const { data, error } = await supabase
    .from('listings')
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
