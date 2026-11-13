import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWireUsageTrend } from './wireUsageAnalytics.ts';
import { INITIAL_INVENTORY, INITIAL_JOBS } from '../data/mockData.ts';

test('calculateWireUsageTrend aggregates monthly historical wire usage and active copper stock', () => {
  const summary = calculateWireUsageTrend(INITIAL_JOBS, INITIAL_INVENTORY, {
    monthsLimit: 6,
  });

  assert.equal(summary.monthlyData.length, 6);
  assert.equal(summary.monthlyData[0].monthKey, '2026-06');
  assert.equal(summary.monthlyData[5].monthKey, '2026-11');
  assert.equal(summary.totalJobsCount, 10);
  assert.equal(summary.totalUsedKg, 186.5);
  assert.equal(summary.peakMonth?.monthKey, '2026-11');
  assert.equal(summary.peakMonth?.totalUsedKg, 98);
  assert.equal(summary.copperSkuCount, 4);
  assert.equal(summary.lowCopperSkuCount, 1);
  // 42.5 + 8.2 + 65.0 + 31.4 = 147.1 kg
  assert.equal(summary.totalCopperStockKg, 147.1);
});

test('calculateWireUsageTrend splits realized vs in-progress wire usage per month', () => {
  const summary = calculateWireUsageTrend(INITIAL_JOBS, INITIAL_INVENTORY);
  const nov = summary.monthlyData.find((m) => m.monthKey === '2026-11');

  assert.ok(nov);
  // SPK-075 (7.2) + SPK-079 (38.0) = 45.2 kg realized
  assert.equal(nov.realizedKg, 45.2);
  // SPK-081 (16.5) + SPK-082 (9.8) + SPK-083 (26.5) = 52.8 kg in progress
  assert.equal(nov.inProgressKg, 52.8);
  assert.equal(nov.totalUsedKg, 98);
});

test('calculateWireUsageTrend maps historical usage against Kawat Email inventory gauges', () => {
  const summary = calculateWireUsageTrend(INITIAL_JOBS, INITIAL_INVENTORY);
  assert.equal(summary.gaugeComparison.length, 4);

  const kw085 = summary.gaugeComparison.find((g) => g.skuCode === 'KW-085');
  assert.ok(kw085);
  assert.equal(kw085.currentStockKg, 8.2);
  assert.ok(kw085.usedKg > 0);
});

test('calculateWireUsageTrend handles empty jobs and inventory cleanly', () => {
  const summary = calculateWireUsageTrend([], []);
  assert.equal(summary.monthlyData.length, 0);
  assert.equal(summary.gaugeComparison.length, 0);
  assert.equal(summary.totalUsedKg, 0);
  assert.equal(summary.averageMonthlyKg, 0);
  assert.equal(summary.peakMonth, null);
  assert.equal(summary.totalCopperStockKg, 0);
});
