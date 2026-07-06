/**
 * Validation utilities for REALM Ag Marketplace
 * Input validation for listings, offers, orders, users, and weighbridge data
 */

import { MaterialType, UnitType, PricingType, UserRole } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Email validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ABN validation (Australian Business Number - 11 digits)
export function isValidABN(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 89 === 0;
}

// Phone validation (Australian format)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+?61|0)[2-478]\d{8}$/.test(cleaned);
}

// Password strength
export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

// Listing validation
export function validateListing(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title || typeof data.title !== 'string' || (data.title as string).trim().length < 5) {
    errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
  }
  if (!data.materialType) {
    errors.push({ field: 'materialType', message: 'Material type is required' });
  }
  if (!data.unitType) {
    errors.push({ field: 'unitType', message: 'Unit type is required' });
  }
  if (!data.type || !['sell', 'buy', 'freight_only'].includes(data.type as string)) {
    errors.push({ field: 'type', message: 'Listing type must be sell, buy, or freight_only' });
  }
  if (data.listingMode && !['list', 'sell', 'auction'].includes(data.listingMode as string)) {
    errors.push({ field: 'listingMode', message: 'Listing mode must be list, sell, or auction' });
  }
  if (data.pricingType && !['fixed', 'offers', 'auction', 'urgent'].includes(data.pricingType as string)) {
    errors.push({ field: 'pricingType', message: 'Pricing type is invalid' });
  }
  if (data.pricePerUnit !== undefined && (isNaN(Number(data.pricePerUnit)) || Number(data.pricePerUnit) < 0)) {
    errors.push({ field: 'pricePerUnit', message: 'Price must be a positive number' });
  }
  if (data.quantityAvailable !== undefined && (isNaN(Number(data.quantityAvailable)) || Number(data.quantityAvailable) <= 0)) {
    errors.push({ field: 'quantityAvailable', message: 'Quantity must be greater than zero' });
  }
  if (data.listingMode === 'sell' && (data.pricePerUnit === undefined || Number(data.pricePerUnit) <= 0)) {
    errors.push({ field: 'pricePerUnit', message: 'Sell It listings require a fixed price greater than zero' });
  }
  if (data.listingMode === 'auction') {
    if (!data.auctionStartsAt || !data.auctionEndsAt) {
      errors.push({ field: 'auctionEndsAt', message: 'Auction start and end times are required' });
    } else if (new Date(data.auctionEndsAt as string) <= new Date(data.auctionStartsAt as string)) {
      errors.push({ field: 'auctionEndsAt', message: 'Auction end time must be after start time' });
    }
    if (data.auctionStartingPrice === undefined || Number(data.auctionStartingPrice) < 0) {
      errors.push({ field: 'auctionStartingPrice', message: 'Auction starting price is required' });
    }
  }
  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.push({ field: 'images', message: 'At least one listing photo is required' });
  }

  return { valid: errors.length === 0, errors };
}

// Offer validation
export function validateOffer(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.pricePerUnit || isNaN(Number(data.pricePerUnit)) || Number(data.pricePerUnit) <= 0) {
    errors.push({ field: 'pricePerUnit', message: 'Price per unit must be positive' });
  }
  if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be positive' });
  }
  if (!data.listingId) {
    errors.push({ field: 'listingId', message: 'Listing ID is required' });
  }

  return { valid: errors.length === 0, errors };
}

// Weighbridge event validation
export function validateWeighbridgeEvent(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.grossWeight || isNaN(Number(data.grossWeight)) || Number(data.grossWeight) <= 0) {
    errors.push({ field: 'grossWeight', message: 'Gross weight must be positive' });
  }
  if (!data.tareWeight || isNaN(Number(data.tareWeight)) || Number(data.tareWeight) <= 0) {
    errors.push({ field: 'tareWeight', message: 'Tare weight must be positive' });
  }
  if (data.grossWeight && data.tareWeight && Number(data.grossWeight) <= Number(data.tareWeight)) {
    errors.push({ field: 'grossWeight', message: 'Gross weight must exceed tare weight' });
  }
  if (!data.vehicleRego || typeof data.vehicleRego !== 'string') {
    errors.push({ field: 'vehicleRego', message: 'Vehicle registration is required' });
  }
  if (!data.source || !['api', 'csv_import', 'email_parse', 'ocr_upload', 'manual'].includes(data.source as string)) {
    errors.push({ field: 'source', message: 'Valid source type is required' });
  }

  return { valid: errors.length === 0, errors };
}

// Feed test validation
export function validateFeedTest(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.source || !['lab', 'on_farm_nir', 'vendor_estimate'].includes(data.source as string)) {
    errors.push({ field: 'source', message: 'Test source is required' });
  }
  const numericFields = ['dryMatter', 'moisture', 'crudeProtein', 'metabolisableEnergy', 'ndf', 'adf', 'digestibility', 'ash'];
  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const val = Number(data[field]);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.push({ field, message: `${field} must be between 0 and 100` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// User registration validation
export function validateRegistration(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.email || !isValidEmail(data.email as string)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!data.password || !isStrongPassword(data.password as string)) {
    errors.push({ field: 'password', message: 'Password must be 8+ chars with upper, lower, and number' });
  }
  if (data.abn && !isValidABN(data.abn as string)) {
    errors.push({ field: 'abn', message: 'Invalid ABN format' });
  }
  if (data.phone && !isValidPhone(data.phone as string)) {
    errors.push({ field: 'phone', message: 'Invalid Australian phone number' });
  }
  if (data.role && !['buyer', 'seller', 'carrier', 'admin'].includes(data.role as string)) {
    errors.push({ field: 'role', message: 'Invalid role' });
  }

  return { valid: errors.length === 0, errors };
}
