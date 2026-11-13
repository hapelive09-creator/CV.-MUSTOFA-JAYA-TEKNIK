import test from 'node:test';
import assert from 'node:assert';
import { APPS_SCRIPT_CODE_GS, generateSheetCsv } from '../utils/appsScriptCode.ts';

test('APPS_SCRIPT_CODE_GS contains essential Apps Script endpoints and sheets', () => {
  assert.ok(APPS_SCRIPT_CODE_GS.includes('doGet(e)'), 'Must include doGet handler');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('doPost(e)'), 'Must include doPost handler');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('setupDatabaseSheets()'), 'Must include sheet setup function');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('SPK_JOBS'), 'Must reference SPK_JOBS sheet');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('DATA_TEKNIS_GULUNGAN'), 'Must reference DATA_TEKNIS_GULUNGAN sheet');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('LAPORAN_QC_MEGGER'), 'Must reference LAPORAN_QC_MEGGER sheet');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('STOK_MATERIAL'), 'Must reference STOK_MATERIAL sheet');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('TAGIHAN_INVOICE'), 'Must reference TAGIHAN_INVOICE sheet');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('saveJobReport'), 'Must support saveJobReport action');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('saveCustomer'), 'Must support saveCustomer action');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('upsertJobSheets'), 'Must include upsertJobSheets helper');
  assert.ok(APPS_SCRIPT_CODE_GS.includes('CV. MUSTOFA JAYA TEKNIK'), 'Must contain company title');
});

test('generateSheetCsv produces valid CSV headers and data for all tables', () => {
  const spkCsv = generateSheetCsv('SPK');
  assert.ok(spkCsv.includes('No_SPK,Tanggal_Masuk'), 'SPK CSV must have valid header');
  assert.ok(spkCsv.includes('SPK-2026-081'), 'SPK CSV must contain sample data');

  const specsCsv = generateSheetCsv('SPECS');
  assert.ok(specsCsv.includes('Alur_Slot,Pitch_Span'), 'Specs CSV must have valid header');
  assert.ok(specsCsv.includes('Class F (155°C)'), 'Specs CSV must contain insulation class');

  const qcCsv = generateSheetCsv('QC');
  assert.ok(qcCsv.includes('No_Sertifikat,No_SPK'), 'QC CSV must have valid header');
  assert.ok(qcCsv.includes('Megger_Body_MOHM'), 'QC CSV must contain Megger column');

  const invCsv = generateSheetCsv('INVENTORY');
  assert.ok(invCsv.includes('Kode_SKU,Nama_Material'), 'Inventory CSV must have SKU column');
  assert.ok(invCsv.includes('KW-095'), 'Inventory CSV must contain wire items');

  const invceCsv = generateSheetCsv('INVOICES');
  assert.ok(invceCsv.includes('No_Faktur,Ref_SPK'), 'Invoices CSV must have invoice columns');

  const custCsv = generateSheetCsv('CUSTOMERS');
  assert.ok(custCsv.includes('ID_Cust,Perusahaan'), 'Customer CSV must have customer columns');
});
