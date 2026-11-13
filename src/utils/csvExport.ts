import { InventoryItem, JobOrder, JobStatus } from '../types';
import { calculateJobTotalRevenue } from './revenueAnalytics';

export const CSV_UTF8_BOM = '\uFEFF';

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  antrean: 'Antrean Masuk',
  diagnosa: 'Bongkar & Diagnosa',
  penawaran: 'Penawaran Biaya',
  insulasi: 'Insulasi Slot',
  gulung: 'Proses Gulung',
  koneksi_lacing: 'Koneksi & Lacing',
  varnish_oven: 'Varnish & Oven',
  mekanikal_bearing: 'Bearing & As',
  qc_testing: 'Pengujian Megger & QC',
  siap_kirim: 'Selesai & Siap Kirim',
  diserahkan: 'Telah Diserahkan',
};

export function getJobStatusLabel(status: JobStatus): string {
  return JOB_STATUS_LABELS[status] || status;
}

/**
 * Escapes a single CSV cell per RFC 4180 and guards against spreadsheet formula injection.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'boolean') {
    return value ? 'YA' : 'TIDAK';
  }

  let str = String(value);

  // Guard string cells that begin with spreadsheet formula prefixes
  const trimmedStart = str.trimStart();
  const isNumericString = /^-?\d+(\.\d+)?$/.test(trimmedStart);
  if (
    !isNumericString &&
    (str.startsWith('=') ||
      str.startsWith('+') ||
      str.startsWith('@') ||
      str.startsWith('\t') ||
      str.startsWith('\r') ||
      str.startsWith('-'))
  ) {
    str = `'${str}`;
  }

  const needsQuoting =
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function serializeCsv(
  headers: string[],
  rows: Array<Array<unknown>>
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(',');
  const dataLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

export const JOB_ORDERS_CSV_HEADERS = [
  'No_SPK',
  'Tanggal_Masuk',
  'Target_Selesai',
  'Tanggal_Selesai',
  'Prioritas',
  'Status_Kode',
  'Status_Tahapan',
  'ID_Pelanggan',
  'Perusahaan_Pelanggan',
  'Nama_PIC',
  'No_Telepon',
  'Merk_Motor',
  'Daya_HP',
  'Daya_kW',
  'Voltase',
  'RPM',
  'Poles',
  'Fasa',
  'Hubungan',
  'Frame_Size',
  'Serial_Number',
  'Tag_Unit_Pabrik',
  'Diagnosa_Awal',
  'Stator_Terbakar',
  'Bearing_Rusak',
  'As_Aus',
  'Megger_Awal_MOhm',
  'Alur_Slot',
  'Pitch_Span',
  'Diameter_Kawat_mm',
  'Kawat_Paralel',
  'Lilitan_Per_Slot',
  'Berat_Tembaga_kg',
  'Kelas_Isolasi',
  'Bearing_DE',
  'Bearing_NDE',
  'Teknisi_Ditugaskan',
  'Hasil_QC',
  'Megger_Body_QC_MOhm',
  'Garansi_Bulan',
  'Kawat_Tagihan_kg',
  'Harga_Kawat_Per_Kg_Rp',
  'Biaya_Material_Lain_Rp',
  'Biaya_Jasa_Rp',
  'Subtotal_Rp',
  'PPN_Persen',
  'PPN_Rp',
  'Total_Tagihan_Rp',
  'DP_Dibayar_Rp',
  'Sisa_Tagihan_Rp',
  'Status_Pembayaran',
];

export function exportJobOrdersToCsv(jobs: JobOrder[]): string {
  const rows = jobs.map((job) => {
    const rev = calculateJobTotalRevenue(job);
    const copperCost = Math.round(
      Math.max(0, job.costs.copperWireKg) * Math.max(0, job.costs.copperPricePerKg)
    );
    const otherMaterialCost = Math.max(0, rev.materialCost - copperCost);
    const dpAmount = Math.max(0, job.dpAmount || 0);
    const remainingDue =
      job.paymentStatus === 'Lunas' ? 0 : Math.max(0, rev.grandTotal - dpAmount);

    return [
      job.id,
      job.orderDate,
      job.targetDate,
      job.completedDate || '',
      job.priority,
      job.status,
      getJobStatusLabel(job.status),
      job.customerId,
      job.customerCompany,
      job.customerName,
      job.customerPhone,
      job.motorBrand,
      job.powerHp,
      job.powerKw,
      job.voltage,
      job.rpm,
      job.poles,
      job.phase,
      job.connection,
      job.frameSize,
      job.serialNumber,
      job.customerUnitTag,
      job.initialDiagnosis.visualCheck,
      job.initialDiagnosis.statorBurned,
      job.initialDiagnosis.bearingDamaged,
      job.initialDiagnosis.shaftWorn,
      job.initialDiagnosis.initialMeggerMohm,
      job.technicalSpecs.slots,
      job.technicalSpecs.pitchSpan,
      job.technicalSpecs.wireDiameterMm,
      job.technicalSpecs.parallelWires,
      job.technicalSpecs.turnsPerSlot,
      job.technicalSpecs.copperWeightKg,
      job.technicalSpecs.insulationClass,
      job.technicalSpecs.bearingFrontType,
      job.technicalSpecs.bearingRearType,
      job.assignedTechnicians.join('; '),
      job.testReport ? job.testReport.overallResult : 'Belum Uji QC',
      job.testReport ? job.testReport.meggerStatorBodyMohm : '',
      job.testReport ? job.testReport.warrantyMonths : '',
      job.costs.copperWireKg,
      job.costs.copperPricePerKg,
      otherMaterialCost,
      rev.laborCost,
      rev.subtotal,
      job.costs.taxPercent,
      rev.taxAmount,
      rev.grandTotal,
      dpAmount,
      remainingDue,
      job.paymentStatus,
    ];
  });

  return serializeCsv(JOB_ORDERS_CSV_HEADERS, rows);
}

export const INVENTORY_CSV_HEADERS = [
  'ID_Item',
  'Kode_SKU',
  'Nama_Material',
  'Kategori',
  'Stok_Fisik',
  'Satuan',
  'Batas_Minimum_Alert',
  'Status_Stok',
  'Harga_Satuan_Rp',
  'Total_Valuasi_Rp',
  'Lokasi_Rak',
];

export function exportInventoryToCsv(inventory: InventoryItem[]): string {
  const rows = inventory.map((item) => {
    const isLow = item.stock <= item.minStockAlert;
    const totalValuation = Math.round(Math.max(0, item.stock) * Math.max(0, item.unitPrice));

    return [
      item.id,
      item.code,
      item.name,
      item.category,
      item.stock,
      item.unit,
      item.minStockAlert,
      isLow ? 'Menipis' : 'Aman',
      item.unitPrice,
      totalValuation,
      item.location,
    ];
  });

  return serializeCsv(INVENTORY_CSV_HEADERS, rows);
}

export function buildBackupFilename(
  dataset: 'job-orders' | 'inventori',
  date: Date = new Date()
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `backup-${dataset}-cv-mustofa-${y}-${m}-${d}.csv`;
}

export function downloadCsvFile(csvContent: string, filename: string): void {
  const payload = csvContent.startsWith(CSV_UTF8_BOM)
    ? csvContent
    : `${CSV_UTF8_BOM}${csvContent}`;
  const blob = new Blob([payload], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
