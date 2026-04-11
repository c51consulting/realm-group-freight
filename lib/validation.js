/**
 * @fileoverview Validation schemas and helpers for all API inputs.
 * Uses plain JS validation (no external schema library dependency)
 * to keep the bundle lean. Each validator returns { valid, errors }.
 */

'use strict';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true if value is a non-empty string.
 * @param {*} v
 * @returns {boolean}
 */
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Returns true if value is a finite number (or numeric string).
 * @param {*} v
 * @returns {boolean}
 */
const isNum = (v) => v !== null && v !== undefined && v !== '' && isFinite(Number(v));

/**
 * Returns true if value is a positive number.
 * @param {*} v
 * @returns {boolean}
 */
const isPos = (v) => isNum(v) && Number(v) > 0;

/**
 * Returns true if value is a valid ISO date string.
 * @param {*} v
 * @returns {boolean}
 */
const isDate = (v) => isStr(v) && !isNaN(Date.parse(v));

/**
 * Returns true if value is one of the allowed enum values.
 * @param {*} v
 * @param {string[]} allowed
 * @returns {boolean}
 */
const isEnum = (v, allowed) => allowed.includes(v);

/**
 * Validates an Australian Business Number (11 digits, spaces allowed).
 * @param {string} abn
 * @returns {boolean}
 */
const isValidABN = (abn) => {
  if (!isStr(abn)) return false;
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const d = digits.split('').map(Number);
  d[0] -= 1;
  const sum = d.reduce((acc, n, i) => acc + n * weights[i], 0);
  return sum % 89 === 0;
};

/**
 * Validates an email address.
 * @param {string} email
 * @returns {boolean}
 */
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Collects errors and returns a result object.
 * @param {Record<string, string>} errors
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
const result = (errors) => ({
  valid: Object.keys(errors).length === 0,
  errors,
});

// ─── Enum constants ──────────────────────────────────────────────────────────

const MATERIAL_TYPES = [
  'hay', 'straw', 'silage', 'grain', 'seed',
  'pellets', 'fertiliser', 'supplement', 'drums', 'bulk_liquid', 'other',
];

const UNIT_TYPES = [
  'bale_small', 'bale_large', 'bale_round', 'bag', 'drum',
  'tonne', 'kg', 'load', 'pallet', 'cubic_metre', 'litre', 'custom',
];

const PRICING_TYPES = ['fixed', 'offers', 'auction', 'urgent'];

const LISTING_TYPES = ['sell', 'buy', 'freight_only'];

const QUALITY_LEVELS = ['basic', 'verified', 'performance'];

const FEED_TEST_SOURCES = ['lab', 'on_farm_nir', 'vendor_estimate'];

const AFIA_GRADES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'ungraded'];

const ORDER_STATUSES = [
  'pending_payment', 'paid', 'in_transit', 'delivered',
  'confirmed', 'disputed', 'refunded', 'completed',
];

const FREIGHT_STATUSES = [
  'open', 'quoted', 'assigned', 'in_transit', 'delivered', 'cancelled',
];

const WEIGH_SOURCES = ['api', 'csv_import', 'ocr_upload', 'manual'];

const USER_ROLES = ['buyer', 'seller', 'carrier', 'admin'];

// ─── Validators ─────────────────────────────────────────────────────────────

/**
 * Validates user registration payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateRegister(body) {
  const e = {};
  const { email, password, role, abn } = body;

  if (!isEmail(email))                          e.email    = 'Valid email required';
  if (!isStr(password) || password.length < 8)  e.password = 'Password must be at least 8 characters';
  if (role && !isEnum(role, USER_ROLES))         e.role     = `Role must be one of: ${USER_ROLES.join(', ')}`;
  if (abn && !isValidABN(abn))                  e.abn      = 'Invalid ABN — must be 11 digits';

  return result(e);
}

/**
 * Validates listing creation/update payload.
 * @param {object} body
 * @param {boolean} [isUpdate=false] — relaxes required-field checks on partial updates
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateListing(body, isUpdate = false) {
  const e = {};
  const {
    type, materialType, unitType, title, pricingType, qualityLevel,
    pricePerUnit, quantityAvailable, estimatedWeightPerUnit,
    deliveryRadius, expiresAt,
  } = body;

  if (!isUpdate) {
    if (!isEnum(type, LISTING_TYPES))             e.type         = `type must be one of: ${LISTING_TYPES.join(', ')}`;
    if (!isEnum(materialType, MATERIAL_TYPES))    e.materialType = `materialType must be one of: ${MATERIAL_TYPES.join(', ')}`;
    if (!isEnum(unitType, UNIT_TYPES))            e.unitType     = `unitType must be one of: ${UNIT_TYPES.join(', ')}`;
    if (!isStr(title))                            e.title        = 'title is required';
  } else {
    if (type && !isEnum(type, LISTING_TYPES))             e.type         = `type must be one of: ${LISTING_TYPES.join(', ')}`;
    if (materialType && !isEnum(materialType, MATERIAL_TYPES)) e.materialType = `materialType must be one of: ${MATERIAL_TYPES.join(', ')}`;
    if (unitType && !isEnum(unitType, UNIT_TYPES))        e.unitType     = `unitType must be one of: ${UNIT_TYPES.join(', ')}`;
  }

  if (pricingType && !isEnum(pricingType, PRICING_TYPES))   e.pricingType  = `pricingType must be one of: ${PRICING_TYPES.join(', ')}`;
  if (qualityLevel && !isEnum(qualityLevel, QUALITY_LEVELS)) e.qualityLevel = `qualityLevel must be one of: ${QUALITY_LEVELS.join(', ')}`;
  if (pricePerUnit !== undefined && !isPos(pricePerUnit))    e.pricePerUnit = 'pricePerUnit must be a positive number';
  if (quantityAvailable !== undefined && !isPos(quantityAvailable)) e.quantityAvailable = 'quantityAvailable must be a positive number';
  if (estimatedWeightPerUnit !== undefined && !isPos(estimatedWeightPerUnit)) e.estimatedWeightPerUnit = 'estimatedWeightPerUnit must be a positive number';
  if (deliveryRadius !== undefined && (!isNum(deliveryRadius) || Number(deliveryRadius) < 0)) e.deliveryRadius = 'deliveryRadius must be a non-negative number';
  if (expiresAt && !isDate(expiresAt))                       e.expiresAt    = 'expiresAt must be a valid date';

  return result(e);
}

/**
 * Validates offer submission payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateOffer(body) {
  const e = {};
  const { listingId, pricePerUnit, quantity, freightPrice, deliveryDate } = body;

  if (!isStr(listingId))                         e.listingId    = 'listingId is required';
  if (!isPos(pricePerUnit))                      e.pricePerUnit = 'pricePerUnit must be a positive number';
  if (!isPos(quantity))                          e.quantity     = 'quantity must be a positive number';
  if (freightPrice !== undefined && !isNum(freightPrice)) e.freightPrice = 'freightPrice must be a number';
  if (deliveryDate && !isDate(deliveryDate))     e.deliveryDate = 'deliveryDate must be a valid date';

  return result(e);
}

/**
 * Validates order status update payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateOrderStatus(body) {
  const e = {};
  const { status } = body;

  if (!isEnum(status, ORDER_STATUSES)) {
    e.status = `status must be one of: ${ORDER_STATUSES.join(', ')}`;
  }

  return result(e);
}

/**
 * Validates freight job creation payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateFreightJob(body) {
  const e = {};
  const { pickupAddress, deliveryAddress, requiredBy, priceOffered, weightKg } = body;

  if (!pickupAddress || typeof pickupAddress !== 'object') e.pickupAddress   = 'pickupAddress object is required';
  if (!deliveryAddress || typeof deliveryAddress !== 'object') e.deliveryAddress = 'deliveryAddress object is required';
  if (requiredBy && !isDate(requiredBy))                   e.requiredBy      = 'requiredBy must be a valid date';
  if (priceOffered !== undefined && !isPos(priceOffered))  e.priceOffered    = 'priceOffered must be a positive number';
  if (weightKg !== undefined && !isPos(weightKg))          e.weightKg        = 'weightKg must be a positive number';

  return result(e);
}

/**
 * Validates a feed test payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateFeedTest(body) {
  const e = {};
  const { listingId, source, afiaGrade, testDate } = body;

  if (!isStr(listingId))                              e.listingId = 'listingId is required';
  if (!isEnum(source, FEED_TEST_SOURCES))             e.source    = `source must be one of: ${FEED_TEST_SOURCES.join(', ')}`;
  if (afiaGrade && !isEnum(afiaGrade, AFIA_GRADES))  e.afiaGrade = `afiaGrade must be one of: ${AFIA_GRADES.join(', ')}`;
  if (testDate && !isDate(testDate))                  e.testDate  = 'testDate must be a valid date';

  return result(e);
}

/**
 * Validates a weigh event payload (API ingestion).
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateWeighEvent(body) {
  const e = {};
  const { source, netWeight, grossWeight, weighedAt } = body;

  if (!isEnum(source, WEIGH_SOURCES))                e.source    = `source must be one of: ${WEIGH_SOURCES.join(', ')}`;
  if (netWeight !== undefined && !isNum(netWeight))  e.netWeight = 'netWeight must be a number';
  if (grossWeight !== undefined && !isNum(grossWeight)) e.grossWeight = 'grossWeight must be a number';
  if (weighedAt && !isDate(weighedAt))               e.weighedAt = 'weighedAt must be a valid date';

  return result(e);
}

/**
 * Validates a review submission payload.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validateReview(body) {
  const e = {};
  const { orderId, revieweeId, rating } = body;

  if (!isStr(orderId))                                          e.orderId   = 'orderId is required';
  if (!isStr(revieweeId))                                       e.revieweeId = 'revieweeId is required';
  if (!isNum(rating) || Number(rating) < 1 || Number(rating) > 5) e.rating = 'rating must be an integer between 1 and 5';

  return result(e);
}

/**
 * Validates a proof-of-delivery submission.
 * @param {object} body
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validatePOD(body) {
  const e = {};
  const { orderId, photoUrls } = body;

  if (!isStr(orderId))                                          e.orderId   = 'orderId is required';
  if (!Array.isArray(photoUrls) || photoUrls.length === 0)     e.photoUrls = 'At least one photo URL is required';

  return result(e);
}

module.exports = {
  validateRegister,
  validateListing,
  validateOffer,
  validateOrderStatus,
  validateFreightJob,
  validateFeedTest,
  validateWeighEvent,
  validateReview,
  validatePOD,
  // Constants exported for reuse
  MATERIAL_TYPES,
  UNIT_TYPES,
  PRICING_TYPES,
  LISTING_TYPES,
  QUALITY_LEVELS,
  FEED_TEST_SOURCES,
  AFIA_GRADES,
  ORDER_STATUSES,
  FREIGHT_STATUSES,
  WEIGH_SOURCES,
  USER_ROLES,
  // Helpers
  isValidABN,
  isEmail,
};
