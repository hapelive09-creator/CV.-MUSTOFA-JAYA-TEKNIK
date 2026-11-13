import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateJobStatusDistribution,
  JOB_STATUS_ORDER,
} from './jobStatusAnalytics';
import { INITIAL_JOBS } from '../data/mockData';
import { JobOrder } from '../types';

test('calculateJobStatusDistribution returns all 11 workflow stages in order even when empty', () => {
  const summary = calculateJobStatusDistribution([]);
  assert.equal(summary.totalJobs, 0);
  assert.equal(summary.activeJobsCount, 0);
  assert.equal(summary.completedJobsCount, 0);
  assert.equal(summary.bottleneckStage, null);
  assert.equal(summary.data.length, JOB_STATUS_ORDER.length);
  assert.equal(summary.data[0].status, 'antrean');
  assert.equal(summary.data[summary.data.length - 1].status, 'diserahkan');
  assert.equal(summary.data.every((d) => d.count === 0), true);
});

test('calculateJobStatusDistribution accurately counts INITIAL_JOBS across active and completed statuses', () => {
  const summary = calculateJobStatusDistribution(INITIAL_JOBS);

  assert.equal(summary.totalJobs, INITIAL_JOBS.length);
  assert.equal(
    summary.activeJobsCount + summary.completedJobsCount,
    INITIAL_JOBS.length
  );

  const sumOfBars = summary.data.reduce((acc, d) => acc + d.count, 0);
  assert.equal(sumOfBars, INITIAL_JOBS.length);

  // Verify specific known counts from INITIAL_JOBS
  const gulung = summary.data.find((d) => d.status === 'gulung');
  const diagnosa = summary.data.find((d) => d.status === 'diagnosa');
  const varnish = summary.data.find((d) => d.status === 'varnish_oven');
  const siapKirim = summary.data.find((d) => d.status === 'siap_kirim');
  const diserahkan = summary.data.find((d) => d.status === 'diserahkan');

  assert.equal(gulung?.count, 1);
  assert.equal(diagnosa?.count, 1);
  assert.equal(varnish?.count, 1);
  assert.equal(siapKirim?.count, 1);
  assert.equal(diserahkan?.count, 6);
  assert.equal(summary.completedJobsCount, 7);
  assert.equal(summary.activeJobsCount, 3);
  assert.equal(summary.urgentActiveCount, 3);
  assert.ok(gulung && gulung.sampleIds.includes('SPK-2026-081'));
});

test('calculateJobStatusDistribution supports in_progress and non_empty filter modes and finds bottleneck', () => {
  const base = INITIAL_JOBS[0];
  const syntheticJobs: JobOrder[] = [
    { ...base, id: 'SPK-1', status: 'gulung', priority: 'Emergency 24 Jam', powerHp: 30 },
    { ...base, id: 'SPK-2', status: 'gulung', priority: 'Biasa', powerHp: 20 },
    { ...base, id: 'SPK-3', status: 'qc_testing', priority: 'Mendesak', powerHp: 15 },
    { ...base, id: 'SPK-4', status: 'diserahkan', priority: 'Biasa', powerHp: 50 },
  ];

  const inProgress = calculateJobStatusDistribution(syntheticJobs, {
    filterMode: 'in_progress',
  });
  assert.equal(inProgress.data.some((d) => d.status === 'siap_kirim'), false);
  assert.equal(inProgress.data.some((d) => d.status === 'diserahkan'), false);
  assert.equal(inProgress.data.length, 9);
  assert.equal(inProgress.bottleneckStage?.status, 'gulung');
  assert.equal(inProgress.bottleneckStage?.count, 2);
  assert.equal(inProgress.bottleneckStage?.totalPowerHp, 50);
  assert.equal(inProgress.bottleneckStage?.urgentCount, 1);

  const nonEmpty = calculateJobStatusDistribution(syntheticJobs, {
    filterMode: 'non_empty',
  });
  assert.equal(nonEmpty.data.length, 3);
  assert.deepEqual(
    nonEmpty.data.map((d) => d.status),
    ['gulung', 'qc_testing', 'diserahkan']
  );
});
