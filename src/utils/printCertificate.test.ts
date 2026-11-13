import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCertificateHtml } from './printCertificate';
import { INITIAL_JOBS } from '../data/mockData';

test('generateCertificateHtml outputs complete certificate with company details and tests', () => {
  const job = INITIAL_JOBS[1]; // Siemens 75 HP with test report
  assert.ok(job.testReport, 'Job should have test report');

  const html = generateCertificateHtml(job, job.testReport!);

  // Check company info
  assert.ok(html.includes('CV. MUSTOFA JAYA TEKNIK'));
  assert.ok(html.includes('QC-CERT'));
  
  // Check motor data
  assert.ok(html.includes('Siemens'));
  assert.ok(html.includes('75 HP'));
  assert.ok(html.includes('PT. Semen Nusantara Perkasa'));

  // Check Megger and test values
  assert.ok(html.includes('850 MΩ'));
  assert.ok(html.includes('IEEE 43'));
  assert.ok(html.includes('1.15'));
  assert.ok(html.includes('6 BULAN GARANSI'));
});
