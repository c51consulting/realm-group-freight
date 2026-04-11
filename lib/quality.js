/**
 * @fileoverview Quality tier calculation and AFIA grade mapping.
 *
 * AFIA (Australian Fodder Industry Association) grades are based on
 * Relative Feed Value (RFV) and crude protein for hay/fodder.
 * Grain quality is assessed separately by protein and moisture.
 *
 * Quality tiers:
 *   basic       — vendor estimate or no test
 *   verified    — at least one on-farm NIR result
 *   performance — at least one accredited lab result
 */

'use strict';

// ─── AFIA Grade Thresholds ───────────────────────────────────────────────────
// Based on AFIA Hay Quality Standards (lucerne/legume hay)
// RFV: Relative Feed Value; CP: Crude Protein % DM

const AFIA_GRADE_THRESHOLDS = [
  { grade: 'A1', minRFV: 175, minCP: 20 },
  { grade: 'A2', minRFV: 155, minCP: 18 },
  { grade: 'B1', minRFV: 130, minCP: 16 },
  { grade: 'B2', minRFV: 110, minCP: 14 },
  { grade: 'C1', minRFV: 90,  minCP: 12 },
  { grade: 'C2', minRFV: 70,  minCP: 10 },
  { grade: 'D',  minRFV: 0,   minCP: 0  },
];

/**
 * Calculates the AFIA grade from RFV and crude protein.
 * Returns 'ungraded' if either value is missing.
 *
 * @param {number|null} rfv  - Relative Feed Value
 * @param {number|null} cp   - Crude Protein % DM
 * @returns {string} AFIA grade ('A1'–'D' or 'ungraded')
 */
function calculateAfiaGrade(rfv, cp) {
  if (rfv == null || cp == null) return 'ungraded';

  for (const threshold of AFIA_GRADE_THRESHOLDS) {
    if (rfv >= threshold.minRFV && cp >= threshold.minCP) {
      return threshold.grade;
    }
  }
  return 'D';
}

/**
 * Calculates Relative Feed Value from NDF and ADF percentages.
 * Formula: RFV = (DDM × DMI) / 1.29
 *   DDM = 88.9 − (0.779 × ADF)
 *   DMI = 120 / NDF
 *
 * @param {number} ndf - Neutral Detergent Fibre %
 * @param {number} adf - Acid Detergent Fibre %
 * @returns {number|null} RFV or null if inputs invalid
 */
function calculateRFV(ndf, adf) {
  if (!ndf || !adf || ndf <= 0 || adf <= 0) return null;
  const ddm = 88.9 - 0.779 * adf;
  const dmi = 120 / ndf;
  return Math.round((ddm * dmi) / 1.29 * 10) / 10;
}

/**
 * Derives the quality tier from an array of feed tests.
 *
 * Rules:
 *   - Any accredited lab test → 'performance'
 *   - Any on-farm NIR test    → 'verified'
 *   - Otherwise               → 'basic'
 *
 * @param {Array<{ source: string }>} feedTests
 * @returns {'basic'|'verified'|'performance'}
 */
function deriveQualityTier(feedTests) {
  if (!Array.isArray(feedTests) || feedTests.length === 0) return 'basic';

  const hasLab = feedTests.some((t) => t.source === 'lab');
  if (hasLab) return 'performance';

  const hasNIR = feedTests.some((t) => t.source === 'on_farm_nir');
  if (hasNIR) return 'verified';

  return 'basic';
}

/**
 * Selects the best AFIA grade from an array of feed tests.
 * Grade order: A1 > A2 > B1 > B2 > C1 > C2 > D > ungraded
 *
 * @param {Array<{ afiaGrade?: string }>} feedTests
 * @returns {string|null} Best AFIA grade or null
 */
function bestAfiaGrade(feedTests) {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'ungraded'];
  let best = null;

  for (const test of feedTests) {
    const grade = test.afiaGrade || test.afia_grade;
    if (!grade) continue;
    if (best === null || order.indexOf(grade) < order.indexOf(best)) {
      best = grade;
    }
  }

  return best;
}

/**
 * Builds a quality tier summary object from a listing's feed tests.
 * This mirrors what the DB trigger computes, for use in application logic.
 *
 * @param {Array<object>} feedTests - Array of feed test records
 * @returns {object} Quality tier summary
 */
function buildQualityTierSummary(feedTests) {
  const tier       = deriveQualityTier(feedTests);
  const hasLabTest = feedTests.some((t) => t.source === 'lab');
  const hasNirTest = feedTests.some((t) => t.source === 'on_farm_nir');
  const grade      = bestAfiaGrade(feedTests);

  const rfvValues = feedTests.map((t) => t.rfv || t.rfv).filter(Boolean);
  const cpValues  = feedTests.map((t) => t.crudeProtein || t.crude_protein).filter(Boolean);
  const meValues  = feedTests.map((t) => t.metabolisableEnergy || t.metabolisable_energy).filter(Boolean);

  return {
    tier,
    hasLabTest,
    hasNirTest,
    bestAfiaGrade: grade,
    bestRfv:       rfvValues.length ? Math.max(...rfvValues) : null,
    bestCp:        cpValues.length  ? Math.max(...cpValues)  : null,
    bestMe:        meValues.length  ? Math.max(...meValues)  : null,
    testCount:     feedTests.length,
  };
}

/**
 * Validates that a listing meets the QA requirements for its quality level.
 * Returns an array of validation error strings (empty = valid).
 *
 * @param {string} qualityLevel - 'basic' | 'verified' | 'performance'
 * @param {Array<{ source: string }>} feedTests
 * @returns {string[]} Validation errors
 */
function validateQualityRequirements(qualityLevel, feedTests) {
  const errors = [];

  if (qualityLevel === 'performance') {
    const hasLab = feedTests.some((t) => t.source === 'lab');
    if (!hasLab) {
      errors.push('Performance-grade listings require at least one accredited lab feed test');
    }
  }

  if (qualityLevel === 'verified') {
    const hasNirOrLab = feedTests.some(
      (t) => t.source === 'lab' || t.source === 'on_farm_nir',
    );
    if (!hasNirOrLab) {
      errors.push('Verified-grade listings require at least one NIR or lab feed test');
    }
  }

  return errors;
}

/**
 * Calculates the price-per-tonne equivalent for cross-unit comparison.
 *
 * @param {number} pricePerUnit         - Price per unit (e.g. per bale)
 * @param {number} estimatedWeightPerUnit - Weight per unit in kg
 * @returns {number|null} Price per tonne or null if inputs invalid
 */
function calcPricePerTonneEquiv(pricePerUnit, estimatedWeightPerUnit) {
  if (!pricePerUnit || !estimatedWeightPerUnit || estimatedWeightPerUnit <= 0) return null;
  return Math.round((pricePerUnit / estimatedWeightPerUnit) * 1000 * 100) / 100;
}

module.exports = {
  calculateAfiaGrade,
  calculateRFV,
  deriveQualityTier,
  bestAfiaGrade,
  buildQualityTierSummary,
  validateQualityRequirements,
  calcPricePerTonneEquiv,
  AFIA_GRADE_THRESHOLDS,
};
