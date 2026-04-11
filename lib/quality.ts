/**
 * Feed quality assessment and AFIA grading for REALM Ag Marketplace
 * Australian Fodder Industry Association grading system
 */

export type AFIAGrade = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'ungraded';

export interface FeedTestData {
  dryMatter?: number;
  moisture?: number;
  crudeProtein?: number;
  metabolisableEnergy?: number;
  ndf?: number;
  adf?: number;
  digestibility?: number;
  ash?: number;
}

export interface QualityAssessment {
  grade: AFIAGrade;
  rfv: number;
  fei: number;
  tier: 'basic' | 'verified' | 'performance';
  summary: string;
}

// Relative Feed Value calculation
export function calculateRFV(adf: number, ndf: number): number {
  const dmi = 120 / ndf; // Dry Matter Intake
  const ddm = 88.9 - (0.779 * adf); // Digestible Dry Matter
  return (dmi * ddm) / 1.29;
}

// Feed Energy Index
export function calculateFEI(me: number, crudeProtein: number): number {
  return (me * 10) + (crudeProtein * 2);
}

// AFIA Grade assignment based on RFV ranges
export function assignAFIAGrade(rfv: number, me?: number): AFIAGrade {
  if (rfv >= 151) return 'A1';
  if (rfv >= 125) return 'A2';
  if (rfv >= 103) return 'B1';
  if (rfv >= 87) return 'B2';
  if (rfv >= 75) return 'C1';
  if (rfv >= 60) return 'C2';
  return 'D';
}

// Full quality assessment
export function assessQuality(data: FeedTestData): QualityAssessment {
  const { adf, ndf, metabolisableEnergy, crudeProtein } = data;

  let rfv = 0;
  let fei = 0;
  let grade: AFIAGrade = 'ungraded';

  if (adf !== undefined && ndf !== undefined) {
    rfv = Math.round(calculateRFV(adf, ndf) * 100) / 100;
    grade = assignAFIAGrade(rfv, metabolisableEnergy);
  }

  if (metabolisableEnergy !== undefined && crudeProtein !== undefined) {
    fei = Math.round(calculateFEI(metabolisableEnergy, crudeProtein) * 100) / 100;
  }

  // Determine quality tier
  let tier: 'basic' | 'verified' | 'performance' = 'basic';
  if (data.dryMatter !== undefined && data.crudeProtein !== undefined && data.metabolisableEnergy !== undefined) {
    tier = 'verified';
  }
  if (tier === 'verified' && adf !== undefined && ndf !== undefined && data.digestibility !== undefined) {
    tier = 'performance';
  }

  const gradeDescriptions: Record<AFIAGrade, string> = {
    A1: 'Premium - Exceptional quality fodder',
    A2: 'Premium - High quality fodder',
    B1: 'Good - Above average quality',
    B2: 'Good - Average quality',
    C1: 'Fair - Below average quality',
    C2: 'Fair - Low quality',
    D: 'Utility - Minimal nutritional value',
    ungraded: 'Insufficient data for grading',
  };

  return {
    grade,
    rfv,
    fei,
    tier,
    summary: gradeDescriptions[grade],
  };
}

// Quality tier pricing multipliers
export function getQualityPriceMultiplier(grade: AFIAGrade): number {
  const multipliers: Record<AFIAGrade, number> = {
    A1: 1.25, A2: 1.15, B1: 1.05, B2: 1.0,
    C1: 0.90, C2: 0.80, D: 0.65, ungraded: 1.0,
  };
  return multipliers[grade];
}
