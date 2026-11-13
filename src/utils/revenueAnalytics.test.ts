import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateJobTotalRevenue,
  calculateMonthlyCompletedRevenue,
  extractMonthKey,
  formatCompactRupiah,
  isCompletedJobOrder,
} from './revenueAnalytics';
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

test('isCompletedJobOrder identifies siap_kirim and diserahkan only', () => {
  assert.equal(isCompletedJobOrder(makeSampleJob({ status: 'siap_kirim' })), true);
  assert.equal(isCompletedJobOrder(makeSampleJob({ status: 'diserahkan' })), true);
  assert.equal(isCompletedJobOrder(makeSampleJob({ status: 'gulung' })), false);
  assert.equal(isCompletedJobOrder(makeSampleJob({ status: 'qc_testing' })), false);
  assert.equal(isCompletedJobOrder(makeSampleJob({ status: 'antrean' })), false);
});

test('extractMonthKey parses YYYY-MM from ISO date strings safely', () => {
  assert.equal(extractMonthKey('2026-11-10'), '2026-11');
  assert.equal(extractMonthKey('2026-07-01'), '2026-07');
  assert.equal(extractMonthKey(undefined), null);
  assert.equal(extractMonthKey('invalid'), null);
  assert.equal(extractMonthKey('2026-13-01'), null);
});

test('calculateJobTotalRevenue computes material, labor, tax, and grandTotal accurately', () => {
  const job = makeSampleJob({
    costs: {
      copperWireKg: 10,
      copperPricePerKg: 200000, // 2,000,000
      bearingFrontCost: 300000,
      bearingRearCost: 200000,
      insulationAndVarnishCost: 400000,
      machiningCost: 100000,
      laborCost: 1500000,
      transportCost: 0,
      taxPercent: 11,
      notes: '',
    },
  });

  const breakdown = calculateJobTotalRevenue(job);
  assert.equal(breakdown.materialCost, 3000000);
  assert.equal(breakdown.laborCost, 1500000);
  assert.equal(breakdown.subtotal, 4500000);
  assert.equal(breakdown.taxAmount, 495000);
  assert.equal(breakdown.grandTotal, 4995000);
});

test('calculateMonthlyCompletedRevenue excludes active jobs and groups completed jobs by month', () => {
  const jobs: JobOrder[] = [
    makeSampleJob({
      id: 'SPK-ACTIVE',
      status: 'gulung',
      orderDate: '2026-11-01',
      completedDate: '2026-11-05',
      costs: {
        copperWireKg: 10,
        copperPricePerKg: 100000,
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
      id: 'SPK-SEP-1',
      status: 'diserahkan',
      completedDate: '2026-09-15',
      costs: {
        copperWireKg: 5,
        copperPricePerKg: 200000,
        bearingFrontCost: 0,
        bearingRearCost: 0,
        insulationAndVarnishCost: 0,
        machiningCost: 0,
        laborCost: 1000000,
        transportCost: 0,
        taxPercent: 10,
        notes: '',
      },
    }),
    makeSampleJob({
      id: 'SPK-NOV-1',
      status: 'siap_kirim',
      completedDate: '2026-11-10',
      costs: {
        copperWireKg: 10,
        copperPricePerKg: 200000,
        bearingFrontCost: 0,
        bearingRearCost: 0,
        insulationAndVarnishCost: 0,
        machiningCost: 0,
        laborCost: 1000000,
        transportCost: 0,
        taxPercent: 10,
        notes: '',
      },
    }),
    makeSampleJob({
      id: 'SPK-NOV-2',
      status: 'diserahkan',
      completedDate: '2026-11-12',
      costs: {
        copperWireKg: 0,
        copperPricePerKg: 0,
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

  const summary = calculateMonthlyCompletedRevenue(jobs, { monthsLimit: 6 });

  assert.equal(summary.monthlyData.length, 6);
  assert.equal(summary.monthlyData[0].monthKey, '2026-06');
  assert.equal(summary.monthlyData[5].monthKey, '2026-11');

  const sep = summary.monthlyData.find((m) => m.monthKey === '2026-09');
  const oct = summary.monthlyData.find((m) => m.monthKey === '2026-10');
  const nov = summary.monthlyData.find((m) => m.monthKey === '2026-11');

  assert.ok(sep);
  assert.equal(sep.revenue, 2200000);
  assert.equal(sep.completedCount, 1);

  assert.ok(oct);
  assert.equal(oct.revenue, 0);
  assert.equal(oct.completedCount, 0);

  assert.ok(nov);
  assert.equal(nov.revenue, 4300000);
  assert.equal(nov.completedCount, 2);

  assert.equal(summary.totalCompletedJobs, 3);
  assert.equal(summary.totalRevenue, 6500000);
  assert.equal(summary.peakMonth?.monthKey, '2026-11');
});

test('calculateMonthlyCompletedRevenue handles zero completed jobs cleanly', () => {
  const activeOnly = [makeSampleJob({ status: 'diagnosa' })];
  const summary = calculateMonthlyCompletedRevenue(activeOnly);
  assert.equal(summary.monthlyData.length, 0);
  assert.equal(summary.totalRevenue, 0);
  assert.equal(summary.totalCompletedJobs, 0);
  assert.equal(summary.peakMonth, null);
});

test('formatCompactRupiah formats axis ticks cleanly', () => {
  assert.equal(formatCompactRupiah(0), 'Rp 0');
  assert.equal(formatCompactRupiah(15000000), 'Rp 15 jt');
  assert.equal(formatCompactRupiah(12500000), 'Rp 12,5 jt');
  assert.equal(formatCompactRupiah(750000), 'Rp 750 rb');
});
