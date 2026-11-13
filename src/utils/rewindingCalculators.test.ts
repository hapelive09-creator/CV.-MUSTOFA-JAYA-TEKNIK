import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWireArea,
  calculateWireWeight,
  calculateEquivalentWires,
  calculateResistanceBalanceDelta,
  calculateMotorFullLoadAmps,
  calculateJobCost,
  formatRupiah,
  SWG_TABLE,
} from './rewindingCalculators';

test('SWG table returns valid diameters', () => {
  assert.equal(SWG_TABLE[20], 0.914);
  assert.equal(SWG_TABLE[16], 1.626);
  assert.equal(SWG_TABLE[30], 0.315);
});

test('calculateWireArea computes correct circular cross-section', () => {
  // d = 1.0mm => r = 0.5mm => Area = π * 0.25 ≈ 0.785398
  const area = calculateWireArea(1.0);
  assert.ok(Math.abs(area - 0.7854) < 0.001);

  // Invalid diameter returns 0
  assert.equal(calculateWireArea(0), 0);
  assert.equal(calculateWireArea(-1), 0);
});

test('calculateWireWeight calculates realistic copper mass', () => {
  // 100m of 1.0mm diameter copper wire
  // Volume = π * (0.0005)^2 * 100 m = 7.85398e-5 m³
  // Mass = 7.85398e-5 * 8890 ≈ 0.698 kg
  const weight = calculateWireWeight(100, 1.0);
  assert.ok(weight > 0.65 && weight < 0.75, `Expected ~0.698 kg, got ${weight}`);

  // 0 length or diameter returns 0
  assert.equal(calculateWireWeight(0, 1.0), 0);
  assert.equal(calculateWireWeight(100, 0), 0);
});

test('calculateEquivalentWires splits single wire into parallel strands', () => {
  // Replacing a 1.20mm wire with 2 parallel wires
  // d_target = 1.20 / sqrt(2) ≈ 0.849 mm
  const twoWires = calculateEquivalentWires(1.2, 2);
  assert.ok(Math.abs(twoWires - 0.849) < 0.01);

  // Replacing with 4 wires => d / 2
  const fourWires = calculateEquivalentWires(1.2, 4);
  assert.equal(fourWires, 0.6);
});

test('calculateResistanceBalanceDelta validates phase balance', () => {
  // Balanced phases
  const balanced = calculateResistanceBalanceDelta(1.24, 1.25, 1.24);
  assert.equal(balanced.isBalanced, true);
  assert.ok(balanced.maxDeltaPct < 2.0);

  // Severely unbalanced phases (e.g. shorted turn or high contact resistance)
  const unbalanced = calculateResistanceBalanceDelta(1.20, 1.60, 1.22);
  assert.equal(unbalanced.isBalanced, false);
  assert.ok(unbalanced.maxDeltaPct > 5.0);

  // Zero inputs
  const zeroTest = calculateResistanceBalanceDelta(0, 1.2, 1.2);
  assert.equal(zeroTest.isBalanced, false);
});

test('calculateMotorFullLoadAmps calculates expected current for 30 HP 380V motor', () => {
  // 30 HP, 380V, 3-Phase => typically ~41-45 Amps
  const amps = calculateMotorFullLoadAmps(30, 380, 3, 0.85, 0.88);
  assert.ok(amps > 38 && amps < 46, `Expected ~42A, got ${amps}`);

  // Invalid values return 0
  assert.equal(calculateMotorFullLoadAmps(0, 380), 0);
  assert.equal(calculateMotorFullLoadAmps(30, 0), 0);
});

test('calculateJobCost aggregates cost correctly', () => {
  const result = calculateJobCost(
    15, // 15 kg copper
    180000, // Rp 180.000 / kg
    650000, // Bearing SKF
    250000, // Insulasi & vernis
    1500000, // Jasa teknisi
    11 // PPN 11%
  );

  assert.equal(result.copperCost, 2700000);
  assert.equal(result.partsSubtotal, 2700000 + 650000 + 250000); // 3,600,000
  assert.equal(result.laborCost, 1500000);
  assert.equal(result.subtotal, 5100000);
  assert.equal(result.taxAmount, 561000);
  assert.equal(result.grandTotal, 5661000);
});

test('formatRupiah formats currency string', () => {
  const str = formatRupiah(5000000);
  assert.ok(str.includes('5.000.000'));
});
