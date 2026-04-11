// ============================================================
// REALM Ag Marketplace — Shared TypeScript types
// ============================================================

export type UserRole = 'buyer' | 'seller' | 'carrier' | 'admin';

export interface User {
  id: string;
  email: string;
  businessName?: string;
  abn?: string;
  phone?: string;
  role: UserRole;
  address?: Address;
  lat?: number;
  lng?: number;
  verified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export type MaterialType =
  | 'hay' | 'straw' | 'silage' | 'grain' | 'seed'
  | 'pellets' | 'fertiliser' | 'supplement' | 'drums'
  | 'bulk_liquid' | 'other';

export type UnitType =
  | 'bale_small' | 'bale_large' | 'bale_round' | 'bag'
  | 'drum' | 'tonne' | 'kg' | 'load' | 'pallet'
  | 'cubic_metre' | 'litre' | 'custom';

export type ListingType = 'sell' | 'buy' | 'freight_only';
export type ListingStatus = 'active' | 'paused' | 'sold' | 'expired' | 'cancelled';
export type PricingType = 'fixed' | 'offers' | 'auction' | 'urgent';
export type QualityLevel = 'basic' | 'verified' | 'performance';

export interface Listing {
  id: string;
  type: ListingType;
  status: ListingStatus;
  materialType: MaterialType;
  materialSubtype?: string;
  title: string;
  description?: string;
  unitType: UnitType;
  unitLabel?: string;
  pricePerUnit?: number;
  pricePerTonneEquiv?: number;
  quantityAvailable?: number;
  quantityUnit?: string;
  minimumOrder?: number;
  estimatedWeightPerUnit?: number;
  pricingType: PricingType;
  freightIncluded: boolean;
  deliveryRadius?: number;
  pickupAddress?: Address;
  pickupLat?: number;
  pickupLng?: number;
  loadingAvailable: boolean;
  images: string[];
  qualityLevel: QualityLevel;
  expiresAt?: string;
  sellerId: string;
  seller?: Pick<User, 'id' | 'businessName' | 'rating' | 'reviewCount' | 'verified' | 'phone' | 'address'>;
  feedTests?: FeedTest[];
  offers?: Pick<Offer, 'id' | 'status' | 'pricePerUnit' | 'quantity' | 'createdAt'>[];
  createdAt: string;
  updatedAt: string;
}

export type FeedTestSource = 'lab' | 'on_farm_nir' | 'vendor_estimate';
export type AfiaGrade = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'ungraded';

export interface FeedTest {
  id: string;
  listingId: string;
  source: FeedTestSource;
  labName?: string;
  deviceId?: string;
  testDate?: string;
  certificateUrl?: string;
  dryMatter?: number;
  moisture?: number;
  crudeProtein?: number;
  metabolisableEnergy?: number;
  ndf?: number;
  adf?: number;
  digestibility?: number;
  afiaGrade?: AfiaGrade;
  rfv?: number;
  fei?: number;
  ash?: number;
  rawData?: Record<string, unknown>;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  status: OfferStatus;
  pricePerUnit: number;
  quantity: number;
  totalPrice?: number;
  freightIncluded: boolean;
  freightPrice?: number;
  deliveryDate?: string;
  message?: string;
  expiresAt?: string;
  listing?: Pick<Listing, 'id' | 'title' | 'materialType' | 'unitType'>;
  buyer?: Pick<User, 'id' | 'businessName' | 'rating' | 'verified'>;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending_payment' | 'paid' | 'in_transit' | 'delivered'
  | 'confirmed' | 'disputed' | 'refunded' | 'completed';

export interface Order {
  id: string;
  orderNumber: string;
  offerId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  carrierId?: string;
  status: OrderStatus;
  totalAmount?: number;
  freightAmount?: number;
  platformFee?: number;
  paymentHeld: boolean;
  paymentReleasedAt?: string;
  stripePaymentIntentId?: string;
  qualityAssuranceLevel: QualityLevel;
  contractTerms?: Record<string, unknown>;
  deliveryEvidence?: Record<string, unknown>;
  confirmedAt?: string;
  disputeReason?: string;
  buyer?: Pick<User, 'id' | 'businessName' | 'phone'>;
  seller?: Pick<User, 'id' | 'businessName' | 'phone'>;
  carrier?: Pick<User, 'id' | 'businessName' | 'phone'>;
  Listing?: Pick<Listing, 'id' | 'title' | 'materialType' | 'unitType'>;
  weighEvents?: WeighbridgeEvent[];
  createdAt: string;
  updatedAt: string;
}

export type WeighSource = 'api' | 'csv_import' | 'email_parse' | 'ocr_upload' | 'manual';
export type SettlementStatus = 'pending' | 'matched' | 'disputed' | 'settled';

export interface WeighbridgeEvent {
  id: string;
  orderId?: string;
  source: WeighSource;
  sourceSystem?: string;
  sourceTicketId?: string;
  siteId?: string;
  siteName?: string;
  vehicleRego?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weightUnit: 'kg' | 'tonne';
  weighedAt?: string;
  operatorName?: string;
  ticketImageUrl?: string;
  gpsLat?: number;
  gpsLng?: number;
  tradeApproved: boolean;
  rawData?: Record<string, unknown>;
  verified: boolean;
  verifiedBy?: string;
  settlementStatus: SettlementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  role: 'buyer' | 'seller' | 'carrier';
  reviewer?: Pick<User, 'id' | 'businessName'>;
  createdAt: string;
  updatedAt: string;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListingFilters {
  materialType?: MaterialType;
  type?: ListingType;
  unitType?: UnitType;
  minPrice?: number;
  maxPrice?: number;
  qualityLevel?: QualityLevel;
  pricingType?: PricingType;
  page?: number;
  limit?: number;
}

export interface AuthResponse {
  user: Pick<User, 'id' | 'email' | 'businessName' | 'role'>;
  token: string;
}

export interface ApiError {
  error: string;
  stack?: string;
}
