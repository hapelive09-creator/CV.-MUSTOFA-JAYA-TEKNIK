import test from 'node:test';
import assert from 'node:assert';
import {
  saveAppsScriptUrl,
  getSavedAppsScriptUrl,
  setLastSyncTime,
  getLastSyncTime,
  addSyncLog,
  getSyncLogs,
  syncAllToAppsScript,
  saveInventoryItemToAppsScript,
  saveJobReportToAppsScript,
  saveCustomerToAppsScript,
  mapSheetRowsToInventory,
  isValidAppsScriptUrl,
} from '../services/appsScriptService.ts';
import { Customer, InventoryItem, JobOrder } from '../types/index.ts';

// Mock localStorage for node:test environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] || null,
    length: Object.keys(store).length,
  };
}

const sampleItem: InventoryItem = {
  id: 'INV-002',
  code: 'KW-085',
  name: 'Kawat Email Tembaga Supreme Ø 0.85 mm (SWG 21)',
  category: 'Kawat Email',
  stock: 24.5,
  unit: 'kg',
  minStockAlert: 15,
  unitPrice: 195000,
  location: 'Rak Tembaga A-2',
};

const sampleCustomer: Customer = {
  id: 'CUST-099',
  name: 'Bpk. Antonius',
  company: 'PT Baja Sakti Industri',
  phone: '081299998888',
  email: 'anton@bajasakti.co.id',
  address: 'Kawasan Jababeka Cikarang',
  industryType: 'Manufaktur Baja',
  totalJobs: 1,
};

const sampleJob: JobOrder = {
  id: 'SPK-2026-099',
  orderDate: '2026-11-12',
  targetDate: '2026-11-16',
  customerId: sampleCustomer.id,
  customerName: sampleCustomer.name,
  customerCompany: sampleCustomer.company,
  customerPhone: sampleCustomer.phone,
  customerUnitTag: 'PUMP-09',
  motorBrand: 'Siemens 1LA7',
  powerHp: 20,
  powerKw: 15,
  rpm: 1470,
  poles: 4,
  voltage: '380V / 660V',
  phase: 3,
  frameSize: '160L',
  connection: 'Δ',
  serialNumber: 'SN-99001',
  status: 'qc_testing',
  priority: 'Biasa',
  assignedTechnicians: ['Hendra Wijaya'],
  initialDiagnosis: {
    visualCheck: 'Gulungan stator hangus pada 2 kutub',
    statorBurned: true,
    bearingDamaged: false,
    shaftWorn: false,
    rotorFriction: false,
    initialMeggerMohm: 0.5,
    notes: 'Uji QC',
  },
  technicalSpecs: {
    slots: 36,
    windingType: 'Lap (Jerat)',
    pitchSpan: '1 - 8',
    coilsPerGroup: 3,
    turnsPerSlot: 28,
    wireDiameterMm: 0.9,
    swg: 20,
    parallelWires: 2,
    copperWeightKg: 8.5,
    insulationClass: 'Class F (155°C)',
    connectionDiagram: '1 Delta (Δ)',
    bearingFrontType: 'SKF 6309-2Z/C3',
    bearingRearType: 'SKF 6209-2Z/C3',
    slotInsulationType: 'Nomex 410 (0.25mm)',
    varnishType: 'Dr. Beck Elmo-Luft 1A',
    leadWireSpec: 'Silikon Tahan Panas 6 mm²',
  },
  costs: {
    copperWireKg: 8.5,
    copperPricePerKg: 265000,
    bearingFrontCost: 420000,
    bearingRearCost: 310000,
    insulationAndVarnishCost: 450000,
    machiningCost: 0,
    laborCost: 1850000,
    transportCost: 0,
    taxPercent: 11,
    notes: 'Standar workshop',
  },
  paymentStatus: 'DP Diterima',
  dpAmount: 2000000,
};

test('saveAppsScriptUrl and getSavedAppsScriptUrl persist URL correctly', () => {
  const testUrl = 'https://script.google.com/macros/s/AKfycbxyz/exec';
  saveAppsScriptUrl(testUrl);
  assert.strictEqual(getSavedAppsScriptUrl(), testUrl);
  assert.strictEqual(isValidAppsScriptUrl(testUrl), true);
  assert.strictEqual(isValidAppsScriptUrl('not-a-url'), false);
});

test('setLastSyncTime and getLastSyncTime persist timestamp correctly', () => {
  const iso = new Date().toISOString();
  setLastSyncTime(iso);
  assert.strictEqual(getLastSyncTime(), iso);
});

test('addSyncLog appends log entries correctly', () => {
  addSyncLog('success', 'Uji koneksi berhasil', 'Detail workshop');
  const logs = getSyncLogs();
  assert.ok(logs.length > 0);
  assert.strictEqual(logs[0].type, 'success');
  assert.strictEqual(logs[0].message, 'Uji koneksi berhasil');
});

test('syncAllToAppsScript operates in local fallback mode when no URL is provided', async () => {
  saveAppsScriptUrl('');
  const res = await syncAllToAppsScript([], [], []);
  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.mode, 'local');
  assert.ok(res.message.includes('Tersimpan dalam database lokal'));
});

test('saveInventoryItemToAppsScript falls back cleanly to local mode without URL', async () => {
  saveAppsScriptUrl('');
  const res = await saveInventoryItemToAppsScript(sampleItem);
  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.mode, 'local');
  assert.ok(res.message.includes('KW-085'));
});

test('saveInventoryItemToAppsScript sends saveInventoryItem POST when URL is configured and handles error payload', async () => {
  const endpoint = 'https://script.google.com/macros/s/AKfycb_test_inv/exec';
  saveAppsScriptUrl(endpoint);

  const originalFetch = globalThis.fetch;
  let capturedBody: any = null;

  try {
    globalThis.fetch = (async (_url: any, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'Stok KW-085 tersimpan!',
          syncedAt: '2026-11-12T18:00:00.000Z',
        }),
      } as any;
    }) as any;

    const okRes = await saveInventoryItemToAppsScript(sampleItem);
    assert.strictEqual(okRes.status, 'success');
    assert.strictEqual(okRes.mode, 'cloud');
    assert.strictEqual(capturedBody.action, 'saveInventoryItem');
    assert.strictEqual(capturedBody.item.code, 'KW-085');
    assert.strictEqual(capturedBody.item.stock, 24.5);

    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'error',
        message: 'Sheet terkunci',
      }),
    })) as any;

    const errRes = await saveInventoryItemToAppsScript(sampleItem);
    assert.strictEqual(errRes.status, 'error');
    assert.strictEqual(errRes.mode, 'cloud');
    assert.ok(errRes.message.includes('Sheet terkunci'));
  } finally {
    globalThis.fetch = originalFetch;
    saveAppsScriptUrl('');
  }
});

test('saveJobReportToAppsScript and saveCustomerToAppsScript auto-save locally and to cloud', async () => {
  saveAppsScriptUrl('');
  const localJobRes = await saveJobReportToAppsScript(sampleJob, 'Laporan QC & Megger');
  assert.strictEqual(localJobRes.status, 'success');
  assert.strictEqual(localJobRes.mode, 'local');
  assert.ok(localJobRes.message.includes('SPK-2026-099'));

  const localCustRes = await saveCustomerToAppsScript(sampleCustomer);
  assert.strictEqual(localCustRes.status, 'success');
  assert.strictEqual(localCustRes.mode, 'local');
  assert.ok(localCustRes.message.includes('PT Baja Sakti Industri'));

  const endpoint = 'https://script.google.com/macros/s/AKfycb_test_report/exec';
  saveAppsScriptUrl(endpoint);
  const originalFetch = globalThis.fetch;
  const capturedPayloads: any[] = [];

  try {
    globalThis.fetch = (async (_url: any, init: any) => {
      capturedPayloads.push(JSON.parse(init.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'Laporan otomatis tersimpan!',
          syncedAt: '2026-11-12T18:30:00.000Z',
        }),
      } as any;
    }) as any;

    const cloudJobRes = await saveJobReportToAppsScript(sampleJob, 'Laporan QC & Megger');
    assert.strictEqual(cloudJobRes.status, 'success');
    assert.strictEqual(cloudJobRes.mode, 'cloud');
    assert.strictEqual(capturedPayloads[0].action, 'saveJobReport');
    assert.strictEqual(capturedPayloads[0].reportType, 'Laporan QC & Megger');
    assert.strictEqual(capturedPayloads[0].job.id, 'SPK-2026-099');

    const cloudCustRes = await saveCustomerToAppsScript(sampleCustomer);
    assert.strictEqual(cloudCustRes.status, 'success');
    assert.strictEqual(cloudCustRes.mode, 'cloud');
    assert.strictEqual(capturedPayloads[1].action, 'saveCustomer');
    assert.strictEqual(capturedPayloads[1].customer.id, 'CUST-099');

    globalThis.fetch = (async () => ({
      ok: false,
      status: 503,
    })) as any;

    const failRes = await saveJobReportToAppsScript(sampleJob, 'Laporan Tagihan Invoice');
    assert.strictEqual(failRes.status, 'error');
    assert.strictEqual(failRes.mode, 'cloud');
    assert.ok(failRes.message.includes('503'));
  } finally {
    globalThis.fetch = originalFetch;
    saveAppsScriptUrl('');
  }
});

test('mapSheetRowsToInventory converts Indonesian STOK_MATERIAL headers to InventoryItem array', () => {
  const mapped = mapSheetRowsToInventory(
    [
      {
        'Kode SKU': 'KW-085',
        'Nama Material & Spesifikasi': 'Kawat Email Tembaga Supreme Ø 0.85 mm (SWG 21)',
        Kategori: 'Kawat Email',
        'Stok Fisik': 30,
        Satuan: 'kg',
        'Batas Minimum Alert': 15,
        'Harga Satuan (Rp)': 195000,
        'Lokasi Rak Gudang': 'Rak Tembaga A-2',
      },
    ],
    [sampleItem]
  );

  assert.strictEqual(mapped.length, 1);
  assert.strictEqual(mapped[0].id, 'INV-002');
  assert.strictEqual(mapped[0].code, 'KW-085');
  assert.strictEqual(mapped[0].stock, 30);
  assert.strictEqual(mapped[0].location, 'Rak Tembaga A-2');
});
