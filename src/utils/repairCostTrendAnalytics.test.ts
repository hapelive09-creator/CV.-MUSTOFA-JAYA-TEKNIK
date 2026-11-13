import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyRepairCostTrend } from './repairCostTrendAnalytics';
import { INITIAL_JOBS } from '../data/mockData';
import { JobOrder } from '../types';

function makeSampleJob(overrides: Partial<JobOrder>): JobOrder {
  const base = structuredClone(INITIAL_JOBS[0]);
  return {
    ...base,
    ...overrides,
    costs: {
      ...base.costs,
      ...(overrides.costs || {}),
    },
  };
}

test('calculateMonthlyRepairCostTrend returns empty summary when given no jobs', () => {
  const summary = calculateMonthlyRepairCostTrend([]);
  assert.equal(summary.monthlyData.length, 0);
  assert.equal(summary.totalRepairCost, 0);
  assert.equal(summary.totalRealizedCost, 0);
  assert.equal(summary.totalSpkCount, 0);
  assert.equal(summary.peakMonth, null);
  assert.equal(summary.momDeltaPct, null);
});

test('calculateMonthlyRepairCostTrend aggregates INITIAL_JOBS by orderDate across 6 months', () => {
  const summary = calculateMonthlyRepairCostTrend(INITIAL_JOBS, { monthsLimit: 6 });

  assert.equal(summary.monthlyData.length, 6);
  assert.equal(summary.monthlyData[0].monthKey, '2026-06');
  assert.equal(summary.monthlyData[5].monthKey, '2026-11');
  assert.equal(summary.totalSpkCount, 10);

  const nov = summary.monthlyData[5];
  // November 2026 has SPK-081 (gulung), SPK-079 (siap_kirim), SPK-082 (varnish_oven), SPK-083 (diagnosa)
  assert.equal(nov.spkCount, 4);
  assert.equal(nov.completedCount, 1);
  assert.equal(nov.inProgressCount, 3);
  assert.ok(nov.totalRepairCost > nov.realizedCost);
  assert.equal(nov.totalRepairCost, nov.realizedCost + nov.inProgressCost);
  assert.equal(summary.peakMonth?.monthKey, '2026-11');
});

test('calculateMonthlyRepairCostTrend separates realized vs in-progress costs and computes MoM delta', () => {
  const jobs: JobOrder[] = [
    makeSampleJob({
      id: 'SPK-OCT',
      orderDate: '2026-10-05',
      status: 'diserahkan',
      costs: {
        copperWireKg: 10,
        copperPricePerKg: 100000, // 1,000,000
        bearingFrontCost: 0,
        bearingRearCost: 0,
        insulationAndVarnishCost: 0,
        machiningCost: 0,
        laborCost: 1000000,
        transportCost: 0,
        taxPercent: 0,
        notes: '',
      },
    }),
    makeSampleJob({
      id: 'SPK-NOV-DONE',
      orderDate: '2026-11-02',
      status: 'siap_kirim',
      costs: {
        copperWireKg: 10,
        copperPricePerKg: 150000, // 1,500,000
        bearingFrontCost: 0,
        bearingRearCost: 0,
        insulationAndVarnishCost: 0,
        machiningCost: 0,
        laborCost: 1500000,
        transportCost: 0,
        taxPercent: 0,
        notes: '',
      },
    }),
    makeSampleJob({
      id: 'SPK-NOV-WIP',
      orderDate: '2026-11-12',
      status: 'gulung',
      costs: {
        copperWireKg: 5,
        copperPricePerKg: 200000, // 1,000,000
        bearingFrontCost: 0,
        bearingRearCost: 0,
        insulationAndVarnishCost: 0,
        machiningCost: 0,
        laborCost: 1000000,
        transportCost: 0,
        taxPercent: 0,
        notes: '',
      },
    }),
  ];

  const summary = calculateMonthlyRepairCostTrend(jobs, { monthsLimit: 6 });
  const oct = summary.monthlyData.find((d) => d.monthKey === '2026-10');
  const nov = summary.monthlyData.find((d) => d.monthKey === '2026-11');

  assert.ok(oct);
  assert.equal(oct.totalRepairCost, 2000000);
  assert.equal(oct.realizedCost, 2000000);
  assert.equal(oct.inProgressCost, 0);

  assert.ok(nov);
  assert.equal(nov.totalRepairCost, 5000000);
  assert.equal(nov.realizedCost, 3000000);
  assert.equal(nov.inProgressCost, 2000000);
  assert.equal(nov.materialCost, 2500000);
  assert.equal(nov.laborCost, 2500000);

  assert.equal(summary.totalRepairCost, 7000000);
  assert.equal(summary.totalRealizedCost, 5000000);
  assert.equal(summary.totalInProgressCost, 2000000);
  assert.equal(summary.momDeltaPct, 150); // (5M - 2M) / 2M = +150%
});

test('calculateMonthlyRepairCostTrend spans full timeline when monthsLimit is omitted', () => {
  const jobs: JobOrder[] = [
    makeSampleJob({ id: 'SPK-JAN', orderDate: '2026-01-10', status: 'diserahkan' }),
    makeSampleJob({ id: 'SPK-NOV', orderDate: '2026-11-10', status: 'gulung' }),
  ];

  const allSummary = calculateMonthlyRepairCostTrend(jobs);
  assert.equal(allSummary.monthlyData.length, 11);
  assert.equal(allSummary.monthlyData[0].monthKey, '2026-01');
  assert.equal(allSummary.monthlyData[10].monthKey, '2026-11');
});
