import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTechnicianProductivity } from './technicianProductivityAnalytics';
import { INITIAL_JOBS, INITIAL_TECHNICIANS } from '../data/mockData';
import { JobOrder } from '../types';

function makeSampleJob(overrides: Partial<JobOrder>): JobOrder {
  const base = structuredClone(INITIAL_JOBS[0]);
  return {
    ...base,
    ...overrides,
  };
}

test('calculateTechnicianProductivity handles zero completed jobs cleanly', () => {
  const activeOnly = [
    makeSampleJob({
      id: 'SPK-ACTIVE',
      status: 'gulung',
      assignedTechnicians: ['Joko Wahyudi'],
    }),
  ];

  const summary = calculateTechnicianProductivity(activeOnly, INITIAL_TECHNICIANS);
  assert.equal(summary.totalCompletedJobs, 0);
  assert.equal(summary.totalCompletedAssignments, 0);
  assert.equal(summary.activeSlices.length, 0);
  assert.equal(summary.topByCount, null);
  assert.equal(summary.data.find((d) => d.name === 'Joko Wahyudi')?.activeCount, 1);
});

test('calculateTechnicianProductivity computes accurate completed job shares for INITIAL_JOBS', () => {
  const summary = calculateTechnicianProductivity(INITIAL_JOBS, INITIAL_TECHNICIANS);

  assert.equal(summary.totalCompletedJobs, 7);
  assert.equal(summary.totalCompletedAssignments, 15);
  assert.equal(summary.activeSlices.length, 4);

  const joko = summary.data.find((d) => d.name === 'Joko Wahyudi');
  const rian = summary.data.find((d) => d.name === 'Rian Firdaus');
  const mustofa = summary.data.find((d) => d.name === 'Pak Mustofa (Master)');
  const budi = summary.data.find((d) => d.name === 'Budi Hartono');

  assert.equal(joko?.completedCount, 5);
  assert.equal(joko?.shareByCountPct, 33.3);
  assert.equal(rian?.completedCount, 4);
  assert.equal(mustofa?.completedCount, 3);
  assert.equal(mustofa?.totalPowerHp, 175);
  assert.equal(budi?.completedCount, 3);

  assert.equal(summary.topByCount?.name, 'Joko Wahyudi');
  assert.equal(summary.topByPower?.name, 'Pak Mustofa (Master)');
});

test('calculateTechnicianProductivity deduplicates technician names per SPK and includes ad-hoc technicians', () => {
  const jobs: JobOrder[] = [
    makeSampleJob({
      id: 'SPK-1',
      status: 'diserahkan',
      powerHp: 40,
      assignedTechnicians: ['Joko Wahyudi', 'Joko Wahyudi', 'Teknisi Tamu'],
    }),
  ];

  const summary = calculateTechnicianProductivity(jobs, INITIAL_TECHNICIANS);
  assert.equal(summary.totalCompletedAssignments, 2);
  const guest = summary.data.find((d) => d.name === 'Teknisi Tamu');
  assert.ok(guest);
  assert.equal(guest.completedCount, 1);
  assert.equal(guest.shareByCountPct, 50);
});
