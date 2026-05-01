// ─── Shared primitives ────────────────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string;

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'carrier' | 'admin';

export type MaterialType =
  | 'hay'
  | 'straw'
  | 'silage'
  | 'grain'
  | 'seed'
  | 'pellets'
  | 'fertiliser'
  | 'supplement'
  | 'drums'
  | 'bulk_liquid'
  | 'other';

// ─── Livestock Types ──────────────────────────────────────────────────────────

export type LivestockCategory =
  | 'cattle'
  | 'sheep'
  | 'goats'
  | 'pigs'
  | 'horses'
  | 'poultry'
  | 'alpacas'
  | 'other_livestock';

export type LivestockPurpose =
  | 'breeding'
  | 'fattening'
  | 'store'
  | 'export'
  | 'slaughter'
  | 'stud'
  | 'companion';

export type LivestockSex = 'male' | 'female' | 'mixed' | 'wether';

// ─── Equipment / Cargo Types (Freight) ────────────────────────────────────────

export type FreightCargoType = 'agricultural_material' | 'livestock' | 'equipment' | 'other_cargo';

export interface EquipmentDimensions {
  heightMm?: number;
  widthMm?: number;
  lengthMm?: number;
  weightKg?: number;
  serialNumber?: string;
  makeModel?: string;
  description?: string;
}

// ─── Listing Category ─────────────────────────────────────────────────────────

export type ListingCategory = 'agricultural_materials' | 'livestock' | 'equipment';

export type UnitType =
  | 'bale_small'
  | 'bale_large'
  | 'bale_round'
  | 'bag'
  | 'drum'
  | 'tonne'
  | 'kg'
  | 'load'
  | 'pallet'
  | 'cubic_metre'
  | 'litre'
  | 'head'
  | 'custom';

export type ListingType = 'sell' | 'buy' | 'freight_only';
export type ListingStatus = 'active' | 'paused' | 'sold' | 'expired' | 'cancelled';
export type PricingType = 'fixed' | 'offers' | 'auction' | 'urgent';
export type QualityLevel = 'basic' | 'verified' | 'performance';
export type AfiaGrade = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'ungraded';
export type FeedTestSource = 'lab' | 'on_farm_nir' | 'vendor_estimate';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'refunded'
  | 'completed';
export type WeighSource = 'api' | 'csv_import' | 'email_parse' | 'ocr_upload' | 'manual';
export type WeightUnit = 'kg' | 'tonne';
export type SettlementStatus = 'pending' | 'matched' | 'disputed' | 'settled';
export type FreightJobStatus = 'open' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  street?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: UUID;
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
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Livestock Listing ────────────────────────────────────────────────────────

export interface LivestockDetails {
  category: LivestockCategory;
  breed?: string;
  sex?: LivestockSex;
  ageMonths?: number;
  headCount: number;
  averageWeightKg?: number;
  purpose?: LivestockPurpose;
  nlisId?: string;
  pic?: string; // Property Identification Code
  healthStatus?: string;
  vaccinationHistory?: string;
  feedRegime?: string;
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export interface Listing {
  id: UUID;
  sellerId: UUID;
  seller?: User;
  category: ListingCategory;
  type: ListingType;
  status: ListingStatus;
  materialType?: MaterialType;
  materialSubtype?: string;
  livestockDetails?: LivestockDetails;
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
  feedTests?: FeedTest[];
  offers?: Offer[];
  expiresAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Feed Test / Quality Tier ─────────────────────────────────────────────────

export interface FeedTest {
  id: UUID;
  listingId: UUID;
  listing?: Listing;
  source: FeedTestSource;
  labName?: string;
  deviceId?: string;
  testDate?: ISODateString;
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
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface QualityTier {
  id: UUID;
  listingId: UUID;
  listing?: Listing;
  level: QualityLevel;
  afiaGrade?: AfiaGrade;
  feedTests: FeedTest[];
  compliant: boolean;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Freight Job ──────────────────────────────────────────────────────────────

export interface FreightJob {
  id: UUID;
  orderId?: UUID;
  order?: Order;
  carrierId?: UUID;
  carrier?: User;
  posterId: UUID;
  poster?: User;
  status: FreightJobStatus;
  pickupAddress: Address;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress: Address;
  deliveryLat?: number;
  deliveryLng?: number;
  cargoType: FreightCargoType;
  materialType?: MaterialType;
  livestockCategory?: LivestockCategory;
  livestockHeadCount?: number;
  equipmentDimensions?: EquipmentDimensions;
  description?: string;
  estimatedWeight?: number;
  weightUnit: WeightUnit;
  distanceKm?: number;
  requiredBy?: ISODateString;
  offeredRate?: number;
  agreedRate?: number;
  fuelCardEligible?: boolean;
  fuelCardCode?: string;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Capricorn Fuel Card ──────────────────────────────────────────────────────

export interface CapricornFuelTransaction {
  id: UUID;
  freightJobId: UUID;
  freightJob?: FreightJob;
  carrierId: UUID;
  carrier?: User;
  accessCode: string;
  distanceKm: number;
  fuelLitres?: number;
  fuelCostAud?: number;
  realmContributionAud?: number;
  receiptUrl?: string;
  odometerStart?: number;
  odometerEnd?: number;
  status: 'pending' | 'approved' | 'claimed' | 'settled';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Offer ────────────────────────────────────────────────────────────────────

export interface Offer {
  id: UUID;
  listingId: UUID;
  listing?: Listing;
  buyerId: UUID;
  buyer?: User;
  status: OfferStatus;
  pricePerUnit: number;
  quantity: number;
  totalPrice?: number;
  freightIncluded: boolean;
  freightPrice?: number;
  deliveryDate?: ISODateString;
  message?: string;
  expiresAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: UUID;
  orderNumber: string;
  offerId: UUID;
  offer?: Offer;
  listingId: UUID;
  listing?: Listing;
  buyerId: UUID;
  buyer?: User;
  sellerId: UUID;
  seller?: User;
  carrierId?: UUID;
  carrier?: User;
  status: OrderStatus;
  totalAmount: number;
  freightAmount?: number;
  platformFee: number;
  paymentHeld: boolean;
  paymentReleasedAt?: ISODateString;
  stripePaymentIntentId?: string;
  qualityAssuranceLevel: QualityLevel;
  contractTerms?: Record<string, unknown>;
  deliveryEvidence?: DeliveryEvidence;
  weighEvents?: WeighEvent[];
  confirmedAt?: ISODateString;
  disputeReason?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Weigh Event ──────────────────────────────────────────────────────────────

export interface WeighEvent {
  id: UUID;
  orderId: UUID;
  order?: Order;
  source: WeighSource;
  sourceSystem?: string;
  sourceTicketId?: string;
  siteId?: string;
  siteName?: string;
  vehicleRego?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weightUnit: WeightUnit;
  weighedAt?: ISODateString;
  operatorName?: string;
  ticketImageUrl?: string;
  gpsLat?: number;
  gpsLng?: number;
  tradeApproved: boolean;
  rawData?: Record<string, unknown>;
  verified: boolean;
  verifiedBy?: UUID;
  settlementStatus: SettlementStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Proof of Delivery ────────────────────────────────────────────────────────

export interface DeliveryEvidence {
  photos?: string[];
  weighEventIds?: UUID[];
  signatureUrl?: string;
  notes?: string;
  deliveredAt?: ISODateString;
  receiverName?: string;
}

export interface ProofOfDelivery {
  id: UUID;
  orderId: UUID;
  order?: Order;
  evidence: DeliveryEvidence;
  submittedBy: UUID;
  confirmedBy?: UUID;
  confirmedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: UUID;
  orderId: UUID;
  reviewerId: UUID;
  reviewer?: User;
  revieweeId: UUID;
  reviewee?: User;
  rating: number;
  comment?: string;
  role: 'buyer' | 'seller' | 'carrier';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ─── Equipment Listing Details (for Listing.equipmentDetails) ────────────────────────
export type EquipmentCondition =
  | 'new'
  | 'as_new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'for_parts';

export interface EquipmentDetails {
  equipmentCategory: string;
  make: string;
  model: string;
  year?: number;
  hours?: number;
  condition: EquipmentCondition;
  serialNumber?: string;
  attachments?: string[];
}
