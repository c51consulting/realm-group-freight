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

export const APP_NAME = 'REALM Ag Marketplace';
export const APP_DESCRIPTION =
    'Australia\'s trusted agricultural materials marketplace. Secure trading for hay, fodder, grain, and livestock with integrated freight and weighbridge verification.';

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

// ─── Material types ───────────────────────────────────────────────────────────

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
    hay: 'Hay',
    straw: 'Straw',
    silage: 'Silage',
    grain: 'Grain',
    seed: 'Seed',
    pellets: 'Pellets',
    fertiliser: 'Fertiliser',
    supplement: 'Supplement',
    drums: 'Drums',
    bulk_liquid: 'Bulk Liquid',
    other: 'Other',
};

export const MATERIAL_TYPES: MaterialType[] = Object.keys(
    MATERIAL_TYPE_LABELS,
  ) as MaterialType[];

// ─── Livestock categories ─────────────────────────────────────────────────────

export const LIVESTOCK_CATEGORY_LABELS: Record<LivestockCategory, string> = {
    cattle:
