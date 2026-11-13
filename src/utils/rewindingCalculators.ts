/**
 * Rewinding engineering calculations & helper functions for CV. Mustofa Jaya Teknik
 */

// SWG (Standard Wire Gauge) to Diameter in mm standard lookup table
export const SWG_TABLE: Record<number, number> = {
  10: 3.251,
  11: 2.946,
  12: 2.642,
  13: 2.337,
  14: 2.032,
  15: 1.829,
  16: 1.626,
  17: 1.422,
  18: 1.219,
  19: 1.016,
  20: 0.914,
  21: 0.813,
  22: 0.711,
  23: 0.610,
  24: 0.559,
  25: 0.508,
  26: 0.457,
  27: 0.417,
  28: 0.376,
  29: 0.345,
  30: 0.315,
  31: 0.295,
  32: 0.274,
  33: 0.254,
  34: 0.234,
  35: 0.213,
  36: 0.193,
};

/**
 * Calculates circular cross-sectional area of wire in mm²: A = π * (d / 2)²
 */
export function calculateWireArea(diameterMm: number): number {
  if (diameterMm <= 0) return 0;
  const radius = diameterMm / 2;
  return Number((Math.PI * radius * radius).toFixed(5));
}

/**
 * Calculates weight of copper wire in kg:
 * Volume = Area (mm²) * Length (m) * 10^-3 cm³/mm²*m = Area * Length * 10^-3 dm³
 * Copper density ≈ 8.89 g/cm³ = 8890 kg/m³
 * Mass (kg) = Area (mm²) * 10^-6 m² * Length (m) * 8890 kg/m³
 */
export function calculateWireWeight(totalLengthMeters: number, diameterMm: number): number {
  if (totalLengthMeters <= 0 || diameterMm <= 0) return 0;
  const areaMm2 = (Math.PI * (diameterMm / 2) ** 2);
  const areaM2 = areaMm2 * 1e-6;
  const weightKg = areaM2 * totalLengthMeters * 8890;
  return Number(weightKg.toFixed(3));
}

/**
 * Calculate required equivalent wire diameter when replacing single wire with N parallel wires:
 * Total Area must match: A_single = N * A_parallel => d_parallel = d_single / sqrt(N)
 */
export function calculateEquivalentWires(originalDiameterMm: number, targetCount: number): number {
  if (originalDiameterMm <= 0 || targetCount <= 0) return 0;
  const targetDiameter = originalDiameterMm / Math.sqrt(targetCount);
  return Number(targetDiameter.toFixed(3));
}

/**
 * Check three-phase winding resistance balance:
 * (Max - Min) / Average * 100%
 * Standard NEMA/IEEE tolerance is max 2-3% imbalance.
 */
export function calculateResistanceBalanceDelta(r1: number, r2: number, r3: number): {
  average: number;
  maxDeltaPct: number;
  isBalanced: boolean;
} {
  if (r1 <= 0 || r2 <= 0 || r3 <= 0) {
    return { average: 0, maxDeltaPct: 0, isBalanced: false };
  }
  const avg = (r1 + r2 + r3) / 3;
  const max = Math.max(r1, r2, r3);
  const min = Math.min(r1, r2, r3);
  const maxDelta = Math.max(Math.abs(max - avg), Math.abs(min - avg));
  const maxDeltaPct = Number(((maxDelta / avg) * 100).toFixed(2));
  
  return {
    average: Number(avg.toFixed(3)),
    maxDeltaPct,
    isBalanced: maxDeltaPct <= 3.0, // ≤ 3% is considered good / balanced
  };
}

/**
 * Estimates full-load motor current (Amperes) for AC Induction Motor:
 * 3-Phase: I = (P_kW * 1000) / (sqrt(3) * V * cosPhi * eta)
 * 1-Phase: I = (P_kW * 1000) / (V * cosPhi * eta)
 */
export function calculateMotorFullLoadAmps(
  powerHp: number,
  voltage: number,
  phases: number = 3,
  powerFactor: number = 0.85,
  efficiency: number = 0.88
): number {
  if (powerHp <= 0 || voltage <= 0) return 0;
  const powerKw = powerHp * 0.7457;
  const denominator = phases === 3
    ? Math.sqrt(3) * voltage * powerFactor * efficiency
    : voltage * powerFactor * efficiency;
  
  if (denominator <= 0) return 0;
  const amps = (powerKw * 1000) / denominator;
  return Number(amps.toFixed(2));
}

/**
 * Calculate job cost and financial breakdown
 */
export function calculateJobCost(
  wireUsedKg: number,
  wirePricePerKg: number,
  bearingCost: number,
  otherPartsCost: number,
  laborCost: number,
  taxPct: number = 11 // PPN 11% in Indonesia
): {
  copperCost: number;
  partsSubtotal: number;
  laborCost: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
} {
  const copperCost = Math.max(0, wireUsedKg) * Math.max(0, wirePricePerKg);
  const partsSubtotal = copperCost + Math.max(0, bearingCost) + Math.max(0, otherPartsCost);
  const subtotal = partsSubtotal + Math.max(0, laborCost);
  const taxAmount = (subtotal * Math.max(0, taxPct)) / 100;
  const grandTotal = subtotal + taxAmount;

  return {
    copperCost: Math.round(copperCost),
    partsSubtotal: Math.round(partsSubtotal),
    laborCost: Math.round(laborCost),
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    grandTotal: Math.round(grandTotal),
  };
}

/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
