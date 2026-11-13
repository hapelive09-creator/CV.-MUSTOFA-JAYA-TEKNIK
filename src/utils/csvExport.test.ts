import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackupFilename,
  escapeCsvCell,
  exportInventoryToCsv,
  exportJobOrdersToCsv,
  INVENTORY_CSV_HEADERS,
  JOB_ORDERS_CSV_HEADERS,
} from './csvExport.ts';
import { INITIAL_INVENTORY, INITIAL_JOBS } from '../data/mockData.ts';

test('escapeCsvCell handles commas, quotes, newlines, nullish values, and formula prefixes', () => {
  assert.equal(escapeCsvCell(null), '');
  assert.equal(escapeCsvCell(undefined), '');
  assert.equal(escapeCsvCell(42.5), '42.5');
  assert.equal(escapeCsvCell(true), 'YA');
  assert.equal(escapeCsvCell(false), 'TIDAK');
  assert.equal(escapeCsvCell('PT. Jaya, Tbk'), '"PT. Jaya, Tbk"');
  assert.equal(escapeCsvCell('Motor "Heavy Duty"'), '"Motor ""Heavy Duty"""');
  assert.equal(escapeCsvCell('Baris 1\nBaris 2'), '"Baris 1\nBaris 2"');
  assert.equal(escapeCsvCell('=SUM(A1:A5)'), "'=SUM(A1:A5)");
  assert.equal(escapeCsvCell('-12.5'), '-12.5');
});

test('exportJobOrdersToCsv serializes all job orders with headers and calculated totals', () => {
  const csv = exportJobOrdersToCsv(INITIAL_JOBS);
  const lines = csv.split('\r\n');

  assert.equal(lines.length, 1 + INITIAL_JOBS.length);
  assert.equal(lines[0], JOB_ORDERS_CSV_HEADERS.join(','));

  // SPK-2026-081 should appear with accurate customer, motor, and calculated totals
  const spk81Line = lines.find((line) => line.startsWith('SPK-2026-081,'));
  assert.ok(spk81Line, 'Expected SPK-2026-081 row in CSV');
  assert.match(spk81Line, /PT\. Indofood CBP Sukses Makmur Tbk/);
  assert.match(spk81Line, /TECO Westinghouse/);
  assert.match(spk81Line, /Proses Gulung/);
  assert.match(spk81Line, /Belum Uji QC/);
  // Subtotal 6522500, PPN 11% = 717475, Grand Total = 7239975, DP = 3000000, Sisa = 4239975
  assert.match(spk81Line, /,6522500,11,717475,7239975,3000000,4239975,DP Diterima$/);

  // SPK-2026-079 has a QC report and Menunggu Pembayaran status
  const spk79Line = lines.find((line) => line.startsWith('SPK-2026-079,'));
  assert.ok(spk79Line, 'Expected SPK-2026-079 row in CSV');
  assert.match(spk79Line, /Lolos QC \(Passed\),850,6,/);
  assert.match(spk79Line, /,17675640,0,17675640,Menunggu Pembayaran$/);

  // SPK-2026-075 is Lunas -> 0 remaining due
  const spk75Line = lines.find((line) => line.startsWith('SPK-2026-075,'));
  assert.ok(spk75Line, 'Expected SPK-2026-075 row in CSV');
  assert.match(spk75Line, /,0,Lunas$/);
});

test('exportJobOrdersToCsv returns headers only when given empty list', () => {
  const csv = exportJobOrdersToCsv([]);
  assert.equal(csv, JOB_ORDERS_CSV_HEADERS.join(','));
});

test('exportInventoryToCsv serializes inventory items with valuation and stock status', () => {
  const csv = exportInventoryToCsv(INITIAL_INVENTORY);
  const lines = csv.split('\r\n');

  assert.equal(lines.length, 1 + INITIAL_INVENTORY.length);
  assert.equal(lines[0], INVENTORY_CSV_HEADERS.join(','));

  // KW-085 has stock 8.2 <= minStockAlert 15 -> Menipis, 8.2 * 195000 = 1599000
  const kw085Line = lines.find((line) => line.includes(',KW-085,'));
  assert.ok(kw085Line, 'Expected KW-085 row in CSV');
  assert.match(kw085Line, /,8\.2,kg,15,Menipis,195000,1599000,/);

  // KW-070 has stock 42.5 > minStockAlert 15 -> Aman, 42.5 * 195000 = 8287500
  const kw070Line = lines.find((line) => line.includes(',KW-070,'));
  assert.ok(kw070Line, 'Expected KW-070 row in CSV');
  assert.match(kw070Line, /,42\.5,kg,15,Aman,195000,8287500,/);
});

test('buildBackupFilename formats deterministic dated filenames', () => {
  const fixedDate = new Date(2026, 10, 12); // 2026-11-12
  assert.equal(
    buildBackupFilename('job-orders', fixedDate),
    'backup-job-orders-cv-mustofa-2026-11-12.csv'
  );
  assert.equal(
    buildBackupFilename('inventori', fixedDate),
    'backup-inventori-cv-mustofa-2026-11-12.csv'
  );
});
