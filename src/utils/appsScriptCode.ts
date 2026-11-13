/**
 * Template Code.gs untuk Google Apps Script
 * CV. MUSTOFA JAYA TEKNIK REWINDING
 * 
 * Script ini dipasang di Google Spreadsheet (Extensions > Apps Script)
 * dan di-deploy sebagai Web App untuk menjadi backend database cloud.
 */

export const APPS_SCRIPT_CODE_GS = `/**
 * ============================================================================
 * SISTEM MANAJEMEN REWINDING CV. MUSTOFA JAYA TEKNIK
 * BACKEND GOOGLE APPS SCRIPT & GOOGLE SHEETS API
 * Versi: 2.5.0 (Industrial Edition - Auto-Save All Reports)
 * Divisi: Rekayasa Dinamo, Overhaul & Quality Control
 * Workshop: Jl. Raya Industri Narogong KM 12.5 Bantargebang Bekasi
 * ============================================================================
 */

// Konstanta Nama Sheet Database
const SHEET_NAMES = {
  SPK: 'SPK_JOBS',
  SPECS: 'DATA_TEKNIS_GULUNGAN',
  QC: 'LAPORAN_QC_MEGGER',
  INVENTORY: 'STOK_MATERIAL',
  INVOICES: 'TAGIHAN_INVOICE',
  CUSTOMERS: 'DATABASE_PELANGGAN',
  LOGS: 'LOG_AKTIVITAS'
};

/**
 * Inisialisasi awal tabel Google Sheets CV. Mustofa Jaya Teknik
 * Jalankan fungsi ini sekali setelah membuka Apps Script.
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet SPK_JOBS
  let sheetSpk = ss.getSheetByName(SHEET_NAMES.SPK);
  if (!sheetSpk) {
    sheetSpk = ss.insertSheet(SHEET_NAMES.SPK);
    const headersSpk = [
      'No SPK', 'Tanggal Masuk', 'Target Selesai', 'Perusahaan / Pabrik', 'Nama PIC',
      'No Telp', 'Tag Unit Pabrik', 'Merk Motor', 'Daya (HP)', 'Daya (kW)',
      'RPM', 'Jumlah Kutub (P)', 'Voltase', 'Hubungan', 'Kerusakan Awal',
      'Stator Terbakar', 'Bearing Rusak', 'Status Pengerjaan', 'Prioritas',
      'Teknisi Ditugaskan', 'Total Biaya (Rp)', 'Status Bayar', 'Terakhir Diupdate'
    ];
    sheetSpk.appendRow(headersSpk);
    formatHeaderRow(sheetSpk, '#B45309'); // Amber dark
  }

  // 2. Sheet DATA_TEKNIS_GULUNGAN
  let sheetSpecs = ss.getSheetByName(SHEET_NAMES.SPECS);
  if (!sheetSpecs) {
    sheetSpecs = ss.insertSheet(SHEET_NAMES.SPECS);
    const headersSpecs = [
      'No SPK', 'Alur / Slot Stator', 'Langkah Kumparan (Pitch Span)', 'Diameter Kawat (mm)',
      'Kawat Paralel', 'Jumlah Lilitan Per Slot', 'Berat Tembaga (kg)', 'Kelas Isolasi',
      'Tipe Hubungan Terminal', 'Bearing Depan (DE)', 'Bearing Belakang (NDE)', 'Catatan Khusus Rekayasa'
    ];
    sheetSpecs.appendRow(headersSpecs);
    formatHeaderRow(sheetSpecs, '#1E293B'); // Slate dark
  }

  // 3. Sheet LAPORAN_QC_MEGGER
  let sheetQc = ss.getSheetByName(SHEET_NAMES.QC);
  if (!sheetQc) {
    sheetQc = ss.insertSheet(SHEET_NAMES.QC);
    const headersQc = [
      'No Sertifikat QC', 'No SPK', 'Tanggal Pengujian', 'Nama Tester QC', 'Tegangan Megger (V)',
      'Megger Stator-Body (MΩ)', 'Megger R-S (MΩ)', 'Megger S-T (MΩ)', 'Megger T-R (MΩ)',
      'Tahanan Fasa U-V (Ω)', 'Tahanan Fasa V-W (Ω)', 'Tahanan Fasa W-U (Ω)', 'Delta Balance (%)',
      'Tegangan Uji Jalan (V)', 'Arus R (A)', 'Arus S (A)', 'Arus T (A)', 'RPM Aktual',
      'Vibrasi DE (mm/s)', 'Vibrasi NDE (mm/s)', 'Suhu Bearing DE (°C)', 'Suhu Bearing NDE (°C)',
      'Keputusan Akhir', 'Masa Garansi (Bulan)', 'Catatan QC'
    ];
    sheetQc.appendRow(headersQc);
    formatHeaderRow(sheetQc, '#047857'); // Emerald dark
  }

  // 4. Sheet STOK_MATERIAL
  let sheetInv = ss.getSheetByName(SHEET_NAMES.INVENTORY);
  if (!sheetInv) {
    sheetInv = ss.insertSheet(SHEET_NAMES.INVENTORY);
    const headersInv = [
      'Kode SKU', 'Nama Material & Spesifikasi', 'Kategori', 'Stok Fisik', 'Satuan',
      'Batas Minimum Alert', 'Harga Satuan (Rp)', 'Total Valuasi (Rp)', 'Lokasi Rak Gudang'
    ];
    sheetInv.appendRow(headersInv);
    formatHeaderRow(sheetInv, '#0369A1'); // Sky dark
  }

  // 5. Sheet TAGIHAN_INVOICE
  let sheetInvce = ss.getSheetByName(SHEET_NAMES.INVOICES);
  if (!sheetInvce) {
    sheetInvce = ss.insertSheet(SHEET_NAMES.INVOICES);
    const headersInvoice = [
      'No Faktur', 'Ref No SPK', 'Tanggal Order', 'Perusahaan Pelanggan', 'Unit Motor',
      'Total Jasa Gulung (Rp)', 'Total Sparepart (Rp)', 'Subtotal (Rp)', 'PPN 11% (Rp)',
      'Total Tagihan (Rp)', 'DP Dibayar (Rp)', 'Sisa Piutang (Rp)', 'Status Pembayaran'
    ];
    sheetInvce.appendRow(headersInvoice);
    formatHeaderRow(sheetInvce, '#4338CA'); // Indigo dark
  }

  // 6. Sheet DATABASE_PELANGGAN
  let sheetCust = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  if (!sheetCust) {
    sheetCust = ss.insertSheet(SHEET_NAMES.CUSTOMERS);
    const headersCust = [
      'ID Pelanggan', 'Nama Perusahaan', 'Kontak PIC', 'No Telepon / WA', 'Email',
      'Alamat Fasilitas / Pabrik', 'Bidang Industri', 'Total Order SPK'
    ];
    sheetCust.appendRow(headersCust);
    formatHeaderRow(sheetCust, '#334155'); // Slate
  }

  return 'Database CV. Mustofa Jaya Teknik berhasil diinisialisasi!';
}

function formatHeaderRow(sheet, bgColor) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground(bgColor);
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setFontSize(10);
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, sheet.getLastColumn());
}

/**
 * Handle HTTP GET Requests (Membaca Data / Cek Status API)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
    
    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Koneksi Google Apps Script CV. Mustofa Jaya Teknik Aktif!',
        timestamp: new Date().toISOString(),
        version: '2.5.0',
        workshop: 'CV. Mustofa Jaya Teknik (Narogong KM 12.5 Bekasi)'
      });
    }

    if (action === 'getAll') {
      return jsonResponse({
        status: 'success',
        jobs: getSheetDataAsObjects(SHEET_NAMES.SPK),
        specs: getSheetDataAsObjects(SHEET_NAMES.SPECS),
        qc: getSheetDataAsObjects(SHEET_NAMES.QC),
        inventory: getSheetDataAsObjects(SHEET_NAMES.INVENTORY),
        invoices: getSheetDataAsObjects(SHEET_NAMES.INVOICES),
        customers: getSheetDataAsObjects(SHEET_NAMES.CUSTOMERS)
      });
    }

    if (action === 'getJobs') {
      return jsonResponse({
        status: 'success',
        data: getSheetDataAsObjects(SHEET_NAMES.SPK)
      });
    }

    if (action === 'getInventory') {
      return jsonResponse({
        status: 'success',
        data: getSheetDataAsObjects(SHEET_NAMES.INVENTORY)
      });
    }

    return jsonResponse({
      status: 'error',
      message: 'Action GET tidak dikenali: ' + action
    });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST Requests (Menulis, Sinkronisasi & Update Data)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || 'syncAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. SINKRONISASI TOTAL SEMUA DATA (6 SHEET LAPORAN)
    if (action === 'syncAll') {
      setupDatabaseSheets();

      // Sinkronisasi SPK, Data Teknis, Laporan QC, dan Tagihan Invoice
      if (payload.jobs && Array.isArray(payload.jobs)) {
        const sheetSpk = ss.getSheetByName(SHEET_NAMES.SPK);
        const sheetSpecs = ss.getSheetByName(SHEET_NAMES.SPECS);
        const sheetQc = ss.getSheetByName(SHEET_NAMES.QC);
        const sheetInvce = ss.getSheetByName(SHEET_NAMES.INVOICES);

        clearDataRows(sheetSpk);
        clearDataRows(sheetSpecs);
        clearDataRows(sheetQc);
        clearDataRows(sheetInvce);

        payload.jobs.forEach(job => {
          sheetSpk.appendRow(buildSpkRow(job));
          sheetSpecs.appendRow(buildSpecsRow(job));
          if (job.testReport) {
            sheetQc.appendRow(buildQcRow(job));
          }
          sheetInvce.appendRow(buildInvoiceRow(job));
        });
      }

      // Sinkronisasi Stok Material
      if (payload.inventory && Array.isArray(payload.inventory)) {
        const sheetInv = ss.getSheetByName(SHEET_NAMES.INVENTORY);
        clearDataRows(sheetInv);
        payload.inventory.forEach(item => {
          const stockQty = Number(item.stock) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          sheetInv.appendRow([
            item.code,
            item.name,
            item.category,
            stockQty,
            item.unit,
            Number(item.minStockAlert) || 0,
            unitPrice,
            stockQty * unitPrice,
            item.location || 'Gudang Utama'
          ]);
        });
      }

      // Sinkronisasi Pelanggan
      if (payload.customers && Array.isArray(payload.customers)) {
        const sheetCust = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
        clearDataRows(sheetCust);
        payload.customers.forEach(c => {
          sheetCust.appendRow(buildCustomerRow(c));
        });
      }

      return jsonResponse({
        status: 'success',
        message: 'Seluruh 6 sheet database berhasil disinkronkan ke Google Sheets CV. Mustofa Jaya Teknik!',
        syncedAt: new Date().toISOString(),
        totalJobsSynced: payload.jobs ? payload.jobs.length : 0,
        totalItemsSynced: payload.inventory ? payload.inventory.length : 0
      });
    }

    // 2. OTOMATIS SIMPAN / UPDATE LAPORAN SPK + DATA TEKNIS + QC + INVOICE
    if ((action === 'saveJob' || action === 'saveJobReport') && payload.job) {
      setupDatabaseSheets();
      const job = payload.job;
      const syncedSheets = upsertJobSheets(ss, job);
      const reportType = payload.reportType || 'SPK & Laporan';

      return jsonResponse({
        status: 'success',
        message: reportType + ' ' + job.id + ' otomatis tersimpan ke Google Sheets (' + syncedSheets.join(', ') + ')!',
        jobId: job.id,
        syncedSheets: syncedSheets,
        syncedAt: new Date().toISOString()
      });
    }

    // 2B. OTOMATIS SIMPAN / UPDATE DATA PELANGGAN
    if (action === 'saveCustomer' && payload.customer) {
      setupDatabaseSheets();
      const customer = payload.customer;
      const sheetCust = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
      upsertRowByKey(sheetCust, 0, customer.id, buildCustomerRow(customer));

      return jsonResponse({
        status: 'success',
        message: 'Data pelanggan ' + customer.company + ' otomatis tersimpan ke sheet DATABASE_PELANGGAN!',
        customerId: customer.id,
        syncedAt: new Date().toISOString()
      });
    }

    // 3. SIMPAN / UPDATE 1 ITEM STOK MATERIAL OTOMATIS
    if (action === 'saveInventoryItem' && payload.item) {
      setupDatabaseSheets();
      const item = payload.item;
      const sheetInv = ss.getSheetByName(SHEET_NAMES.INVENTORY);
      const data = sheetInv.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(item.code).trim()) {
          rowIndex = i + 1;
          break;
        }
      }

      const stockQty = Number(item.stock) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const rowData = [
        item.code,
        item.name,
        item.category,
        stockQty,
        item.unit,
        Number(item.minStockAlert) || 0,
        unitPrice,
        stockQty * unitPrice,
        item.location || 'Gudang Utama'
      ];

      if (rowIndex > 0) {
        sheetInv.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheetInv.appendRow(rowData);
      }

      return jsonResponse({
        status: 'success',
        message: 'Stok ' + item.code + ' (' + stockQty + ' ' + item.unit + ') berhasil disimpan ke sheet STOK_MATERIAL!',
        itemCode: item.code,
        stock: stockQty,
        syncedAt: new Date().toISOString()
      });
    }

    // 4. SINKRONISASI TABEL STOK MATERIAL SAJA
    if (action === 'syncInventory' && Array.isArray(payload.inventory)) {
      setupDatabaseSheets();
      const sheetInv = ss.getSheetByName(SHEET_NAMES.INVENTORY);
      clearDataRows(sheetInv);
      payload.inventory.forEach(item => {
        const stockQty = Number(item.stock) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        sheetInv.appendRow([
          item.code,
          item.name,
          item.category,
          stockQty,
          item.unit,
          Number(item.minStockAlert) || 0,
          unitPrice,
          stockQty * unitPrice,
          item.location || 'Gudang Utama'
        ]);
      });

      return jsonResponse({
        status: 'success',
        message: payload.inventory.length + ' item stok berhasil disinkronkan ke sheet STOK_MATERIAL!',
        syncedAt: new Date().toISOString(),
        totalItemsSynced: payload.inventory.length
      });
    }

    return jsonResponse({
      status: 'error',
      message: 'Action POST tidak dikenali: ' + action
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Utility: Upsert baris berdasarkan key unik di kolom tertentu
 */
function upsertRowByKey(sheet, keyColIndex, keyValue, rowData) {
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const target = String(keyValue).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]).trim() === target) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Utility: Upsert 1 SPK ke seluruh sheet laporan terkait (SPK, Data Teknis, QC, Invoice)
 */
function upsertJobSheets(ss, job) {
  const synced = [];
  const sheetSpk = ss.getSheetByName(SHEET_NAMES.SPK);
  upsertRowByKey(sheetSpk, 0, job.id, buildSpkRow(job));
  synced.push(SHEET_NAMES.SPK);

  const sheetSpecs = ss.getSheetByName(SHEET_NAMES.SPECS);
  upsertRowByKey(sheetSpecs, 0, job.id, buildSpecsRow(job));
  synced.push(SHEET_NAMES.SPECS);

  if (job.testReport) {
    const sheetQc = ss.getSheetByName(SHEET_NAMES.QC);
    upsertRowByKey(sheetQc, 1, job.id, buildQcRow(job));
    synced.push(SHEET_NAMES.QC);
  }

  const sheetInvce = ss.getSheetByName(SHEET_NAMES.INVOICES);
  upsertRowByKey(sheetInvce, 1, job.id, buildInvoiceRow(job));
  synced.push(SHEET_NAMES.INVOICES);

  return synced;
}

function calculateJobCostsSummary(job) {
  const c = job.costs || {};
  const copperCost = (Number(c.copperWireKg) || 0) * (Number(c.copperPricePerKg) || 0);
  const partsSubtotal = copperCost +
    (Number(c.bearingFrontCost) || 0) +
    (Number(c.bearingRearCost) || 0) +
    (Number(c.insulationAndVarnishCost) || 0) +
    (Number(c.machiningCost) || 0) +
    (Number(c.transportCost) || 0);
  const laborCost = Number(c.laborCost) || 0;
  const subtotal = partsSubtotal + laborCost;
  const taxPct = Number(c.taxPercent) || 0;
  const taxAmount = Math.round((subtotal * taxPct) / 100);
  const grandTotal = Math.round(subtotal + taxAmount);
  return { partsSubtotal: Math.round(partsSubtotal), laborCost: Math.round(laborCost), subtotal: Math.round(subtotal), taxAmount, grandTotal };
}

function buildSpkRow(job) {
  const cost = calculateJobCostsSummary(job);
  const diag = job.initialDiagnosis || {};
  return [
    job.id, job.orderDate, job.targetDate, job.customerCompany, job.customerName,
    job.customerPhone, job.customerUnitTag, job.motorBrand, job.powerHp, job.powerKw,
    job.rpm, job.poles, job.voltage, job.connection, diag.visualCheck || '-',
    diag.statorBurned ? 'YA' : 'TIDAK', diag.bearingDamaged ? 'YA' : 'TIDAK',
    job.status, job.priority, (job.assignedTechnicians || []).join(', '), cost.grandTotal,
    job.paymentStatus, new Date().toLocaleString('id-ID')
  ];
}

function buildSpecsRow(job) {
  const s = job.technicalSpecs || {};
  return [
    job.id,
    s.slots || 0,
    s.pitchSpan || '-',
    s.wireDiameterMm || 0,
    s.parallelWires || 1,
    s.turnsPerSlot || 0,
    s.copperWeightKg || 0,
    s.insulationClass || '-',
    s.connectionDiagram || s.connectionType || '-',
    s.bearingFrontType || s.bearingFront || '-',
    s.bearingRearType || s.bearingRear || '-',
    s.slotInsulationType || s.specialNotes || '-'
  ];
}

function buildQcRow(job) {
  const q = job.testReport;
  const certNo = 'QC-CERT/' + new Date().getFullYear() + '/' + (job.id.split('-').pop() || '001');
  const r = q.windingResistanceOhm || { uv: 0, vw: 0, wu: 0 };
  const avgR = (r.uv + r.vw + r.wu) / 3;
  const deltaPct = avgR > 0
    ? (((Math.max(r.uv, r.vw, r.wu) - Math.min(r.uv, r.vw, r.wu)) / avgR) * 100).toFixed(2)
    : '0.00';

  return [
    certNo,
    job.id,
    q.testDate,
    q.testerName,
    q.meggerVoltageV,
    q.meggerStatorBodyMohm,
    q.meggerPhasePhaseMohm.rs,
    q.meggerPhasePhaseMohm.st,
    q.meggerPhasePhaseMohm.tr,
    r.uv,
    r.vw,
    r.wu,
    deltaPct,
    q.noLoadTest.appliedVoltageV,
    q.noLoadTest.currentR_Amps,
    q.noLoadTest.currentS_Amps,
    q.noLoadTest.currentT_Amps,
    q.noLoadTest.actualRpm,
    q.noLoadTest.vibrationDE_mm_s,
    q.noLoadTest.vibrationNDE_mm_s,
    q.noLoadTest.tempDE_C,
    q.noLoadTest.tempNDE_C,
    q.overallResult,
    q.warrantyMonths,
    q.qcNotes
  ];
}

function buildInvoiceRow(job) {
  const spkCode = (job.id || '').split('-').pop() || '001';
  const invoiceNo = 'INV/' + new Date().getFullYear() + '/' + spkCode;
  const cost = calculateJobCostsSummary(job);
  const dp = job.paymentStatus === 'Lunas' ? cost.grandTotal : (Number(job.dpAmount) || 0);
  const sisa = Math.max(0, cost.grandTotal - dp);

  return [
    invoiceNo,
    job.id,
    job.orderDate,
    job.customerCompany,
    job.motorBrand + ' ' + job.powerHp + ' HP',
    cost.laborCost,
    cost.partsSubtotal,
    cost.subtotal,
    cost.taxAmount,
    cost.grandTotal,
    dp,
    sisa,
    job.paymentStatus
  ];
}

function buildCustomerRow(c) {
  return [
    c.id,
    c.company,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.industryType,
    c.totalJobs
  ];
}

/**
 * Utility: Bersihkan baris data tanpa menghapus header tabel
 */
function clearDataRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

/**
 * Utility: Membaca sheet menjadi daftar objek JSON berpasangan key-value
 */
function getSheetDataAsObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Utility: Membentuk response JSON dengan header CORS lengkap
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Generator CSV Template untuk 6 Tabel Database CV. Mustofa Jaya Teknik
 */
export function generateSheetCsv(sheetType: 'SPK' | 'SPECS' | 'QC' | 'INVENTORY' | 'INVOICES' | 'CUSTOMERS'): string {
  switch (sheetType) {
    case 'SPK':
      return [
        'No_SPK,Tanggal_Masuk,Target_Selesai,Perusahaan,Nama_PIC,No_Telp,Tag_Unit,Merk_Motor,Daya_HP,Daya_KW,RPM,Poles,Voltase,Hubungan,Status,Prioritas,Total_Biaya,Status_Bayar',
        'SPK-2026-081,2026-11-09,2026-11-14,PT. Indofood CBP Sukses Makmur Tbk,Bpk. Hartono,0813-8821-9920,MTR-MIXER-LINE-3,TECO Westinghouse,30,22,1460,4P,380 V,Delta (Δ),gulung,Mendesak,5417500,DP Diterima',
        'SPK-2026-079,2026-11-05,2026-11-10,PT. Semen Nusantara Perkasa,Ibu Ratna Dewi,0812-7711-4455,PUMP-SLURRY-02,Siemens SIMOTICS SD,75,55,2960,2P,380 / 660 V,Star-Delta (Y-Δ),siap_kirim,Biasa,12024000,Lunas',
        'SPK-2026-082,2026-11-11,2026-11-12,PT. Mayora Indah Tbk Divisi Biskuit,Bpk. Agus Salim,0815-9988-1234,MTR-OVEN-CONVEYOR-01,ABB M3BP,15,11,1440,4P,380 V,Delta (Δ),varnish_oven,Emergency 24 Jam,3711000,Menunggu Pembayaran'
      ].join('\n');

    case 'SPECS':
      return [
        'No_SPK,Alur_Slot,Pitch_Span,Diameter_Kawat_MM,Kawat_Paralel,Lilitan_Per_Slot,Berat_Tembaga_KG,Kelas_Isolasi,Hubungan_Terminal,Bearing_DE,Bearing_NDE',
        'SPK-2026-081,48,1-10-12,1.15,2,38,18.5,Class F (155°C),Delta (Δ),6312-2Z/C3,6310-2Z/C3',
        'SPK-2026-079,60,1-14-16,1.40,3,24,42.0,Class H (180°C),Star-Delta (Y-Δ),6316-C3,6314-C3',
        'SPK-2026-082,36,1-8-10,0.95,2,44,11.2,Class H (180°C),Delta (Δ),6309-2Z/C3,6308-2Z/C3'
      ].join('\n');

    case 'QC':
      return [
        'No_Sertifikat,No_SPK,Tanggal_Uji,Tester_QC,Megger_Body_MOHM,Megger_PhPh_MOHM,Delta_Resistance_Pct,Arus_R_A,Arus_S_A,Arus_T_A,Vibrasi_MM_S,Suhu_Bearing_C,Hasil_QC,Garansi_Bulan',
        'QC-CERT/2026/079,SPK-2026-079,2026-11-10,Rian Firdaus,850,810,0.47,24.5,24.2,24.6,1.15,44.5,Lolos QC (Passed),6',
        'QC-CERT/2026/075,SPK-2026-075,2026-11-02,Rian Firdaus,620,590,0.65,4.8,4.7,4.8,0.85,38.0,Lolos QC (Passed),3'
      ].join('\n');

    case 'INVENTORY':
      return [
        'Kode_SKU,Nama_Material,Kategori,Stok_Fisik,Satuan,Batas_Minimum,Harga_Satuan,Lokasi_Rak',
        'KW-095,Kawat Email Supreme Ø 0.95 mm (SWG 20),Kawat Email,28,kg,15,195000,Rak Tembaga A-1',
        'KW-115,Kawat Email Supreme Ø 1.15 mm (SWG 18.5),Kawat Email,4,kg,20,192000,Rak Tembaga A-2',
        'KW-140,Kawat Email Supreme Ø 1.40 mm (SWG 17),Kawat Email,52,kg,15,188000,Rak Tembaga A-3',
        'BRG-6312,Bearing SKF Explorer 6312-2Z/C3,Bearing,2,pcs,4,340000,Lemari Bearing B-2',
        'VRN-DRB,Varnish Dr. Beck Elmo Luft 1A Air Drying,Varnish & Kimia,8,liter,5,185000,Ruang Kimia C-1'
      ].join('\n');

    case 'INVOICES':
      return [
        'No_Faktur,Ref_SPK,Tanggal_Order,Perusahaan,Unit_Motor,Total_Tagihan,DP_Dibayar,Sisa_Piutang,Status_Pembayaran',
        'INV/2026/081,SPK-2026-081,2026-11-09,PT. Indofood CBP Sukses Makmur Tbk,TECO Westinghouse 30 HP,6013425,2500000,3513425,DP Diterima',
        'INV/2026/079,SPK-2026-079,2026-11-05,PT. Semen Nusantara Perkasa,Siemens SIMOTICS SD 75 HP,13346640,13346640,0,Lunas',
        'INV/2026/082,SPK-2026-082,2026-11-11,PT. Mayora Indah Tbk Divisi Biskuit,ABB M3BP 15 HP,4119210,0,4119210,Menunggu Pembayaran'
      ].join('\n');

    case 'CUSTOMERS':
      return [
        'ID_Cust,Perusahaan,Kontak_PIC,Telepon_WA,Email,Alamat,Bidang_Industri,Total_Order',
        'CUST-001,PT. Indofood CBP Sukses Makmur Tbk,Bpk. Hartono,0813-8821-9920,hartono.maint@indofood.co.id,Kawasan Industri MM2100 Cikarang Barat,Manufaktur Makanan & Minuman,4',
        'CUST-002,PT. Semen Nusantara Perkasa,Ibu Ratna Dewi (Procurement),0812-7711-4455,ratna.proc@semennusantara.co.id,Jl. Raya Narogong KM 18 Cileungsi Bogor,Industri Semen & Material,6',
        'CUST-003,PT. Mayora Indah Tbk Divisi Biskuit,Bpk. Agus Salim,0815-9988-1234,agus.plant@mayora.co.id,Kawasan Industri Telesonic Jatake Tangerang,Manufaktur Makanan,2'
      ].join('\n');
  }
}
