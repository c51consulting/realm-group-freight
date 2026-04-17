import type {
  MaterialType,
  UnitType,
  ListingType,
  PricingType,
  QualityLevel,
  AfiaGrade,
  OrderStatus,
  OfferStatus,
  FreightJobStatus,
  LivestockCategory,
  LivestockPurpose,
  LivestockSex,
  ListingCategory,
  FreightCargoType,
} from './types';

// ─── App metadata ─────────────────────────────────────────────────────────────
export const APP_NAME = 'REALM Group Freight';
export const APP_DESCRIPTION =
  'Agricultural materials, livestock and equipment marketplace — hay, fodder, grain, silage, seed, fertiliser, cattle, sheep and more.';
export const PLATFORM_FEE_PERCENT = 5;

// ─── Listing categories ───────────────────────────────────────────────────────
export const LISTING_CATEGORY_LABELS: Record<ListingCategory, string> = {
  agricultural_materials: 'Agricultural Materials',
  livestock: 'Livestock',
  equipment: 'Equipment',
};

export const LISTING_CATEGORIES: ListingCategory[] = Object.keys(
  LISTING_CATEGORY_LABELS,
) as ListingCategory[];
