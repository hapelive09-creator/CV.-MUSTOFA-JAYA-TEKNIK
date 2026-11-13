import { JobOrder, InventoryItem, Customer, InventoryCategory } from '../types';

const APPS_SCRIPT_URL_KEY = 'mustofa_apps_script_url';
const LAST_SYNC_KEY = 'mustofa_apps_script_last_sync';
const SYNC_LOGS_KEY = 'mustofa_apps_script_logs';

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}

export interface AppsScriptResponse {
  status: 'success' | 'error';
  message: string;
  mode?: 'cloud' | 'local';
  data?: any;
  syncedAt?: string;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

/**
 * Mengambil URL Google Apps Script Web App dari penyimpanan lokal
 */
export function getSavedAppsScriptUrl(): string {
  const storage = getStorage();
  return storage ? storage.getItem(APPS_SCRIPT_URL_KEY) || '' : '';
}

/**
 * Menyimpan URL Google Apps Script Web App ke penyimpanan lokal
 */
export function saveAppsScriptUrl(url: string): void {
  const storage = getStorage();
  if (storage) {
    storage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
  }
}

/**
 * Validasi dasar format URL Google Apps Script Web App
 */
export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Mengambil waktu sinkronisasi terakhir
 */
export function getLastSyncTime(): string | null {
  const storage = getStorage();
  return storage ? storage.getItem(LAST_SYNC_KEY) : null;
}

/**
 * Menyimpan waktu sinkronisasi terakhir
 */
export function setLastSyncTime(isoString: string): void {
  const storage = getStorage();
  if (storage) {
    storage.setItem(LAST_SYNC_KEY, isoString);
  }
}

/**
 * Mengambil riwayat log sinkronisasi
 */
export function getSyncLogs(): SyncLog[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SYNC_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Menambahkan catatan log sinkronisasi
 */
export function addSyncLog(type: 'success' | 'error' | 'info', message: string, details?: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const logs = getSyncLogs();
    const newLog: SyncLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      details,
    };
    const updated = [newLog, ...logs].slice(0, 30);
    storage.setItem(SYNC_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

const VALID_CATEGORIES: InventoryCategory[] = [
  'Kawat Email',
  'Bahan Isolasi',
  'Bearing',
  'Varnish & Kimia',
  'Kabel & Terminal',
  'Lainnya',
];

function normalizeCategory(raw: unknown): InventoryCategory {
  const val = String(raw || '').trim();
  if (VALID_CATEGORIES.includes(val as InventoryCategory)) {
    return val as InventoryCategory;
  }
  return 'Lainnya';
}

/**
 * Memetakan baris data dari sheet STOK_MATERIAL (header Bahasa Indonesia atau camelCase) ke InventoryItem[]
 */
export function mapSheetRowsToInventory(
  rows: Array<Record<string, unknown> | InventoryItem>,
  existingItems: InventoryItem[] = []
): InventoryItem[] {
  if (!Array.isArray(rows)) return [];

  const existingByCode = new Map(
    existingItems.map((item) => [item.code.trim().toUpperCase(), item])
  );

  return rows
    .map((rawRow, index) => {
      const row = rawRow as Record<string, unknown>;
      const code = String(row['Kode SKU'] ?? row.code ?? '').trim();
      const name = String(row['Nama Material & Spesifikasi'] ?? row.name ?? '').trim();
      if (!code && !name) return null;

      const existing = existingByCode.get(code.toUpperCase());
      const rawStock = row['Stok Fisik'] ?? row.stock ?? 0;
      const rawMin = row['Batas Minimum Alert'] ?? row.minStockAlert ?? 0;
      const rawPrice = row['Harga Satuan (Rp)'] ?? row.unitPrice ?? 0;

      return {
        id: String(row.id ?? existing?.id ?? `INV-SHEET-${code || index + 1}`),
        code: code || `SKU-${index + 1}`,
        name: name || existing?.name || 'Material Tanpa Nama',
        category: normalizeCategory(row['Kategori'] ?? row.category ?? existing?.category),
        stock: Number.isFinite(Number(rawStock)) ? Number(rawStock) : 0,
        unit: String(row['Satuan'] ?? row.unit ?? existing?.unit ?? 'pcs').trim() || 'pcs',
        minStockAlert: Number.isFinite(Number(rawMin)) ? Number(rawMin) : 0,
        unitPrice: Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : 0,
        location: String(row['Lokasi Rak Gudang'] ?? row.location ?? existing?.location ?? 'Gudang Utama').trim() || 'Gudang Utama',
      } satisfies InventoryItem;
    })
    .filter((item): item is InventoryItem => item !== null);
}

/**
 * Uji konektivitas ke Google Apps Script Web App (Ping Test)
 */
export async function testAppsScriptConnection(customUrl?: string): Promise<AppsScriptResponse> {
  const url = (customUrl ?? getSavedAppsScriptUrl()).trim();

  if (!url) {
    return {
      status: 'error',
      message: 'URL Google Apps Script belum diisi. Masukkan URL Web App terlebih dahulu.',
    };
  }

  try {
    const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const data = await res.json();
    if (data?.status === 'error') {
      throw new Error(data.message || 'Server Google Apps Script mengembalikan error.');
    }

    addSyncLog('success', 'Koneksi ke Google Apps Script berhasil', data.workshop || url);
    return {
      status: 'success',
      mode: 'cloud',
      message: data.message || 'Koneksi ke Google Apps Script aktif dan terverifikasi!',
      data,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? 'Koneksi timeout (lebih dari 10 detik). Periksa deployment Apps Script Anda.'
      : error.message || 'Gagal terhubung ke Google Apps Script Web App.';
    addSyncLog('error', 'Gagal menghubungkan ke Google Apps Script', errText);
    return {
      status: 'error',
      message: errText,
    };
  }
}

/**
 * Sinkronisasikan seluruh database lokal ke Google Spreadsheet melalui Google Apps Script
 */
export async function syncAllToAppsScript(
  jobs: JobOrder[],
  inventory: InventoryItem[],
  customers: Customer[]
): Promise<AppsScriptResponse> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    // Mode Simulasi Lokal jika belum memasang URL Apps Script
    const now = new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog(
      'info',
      'Penyimpanan Lokal Aktif (Simulasi Cloud)',
      `Tersimpan ${jobs.length} SPK, ${inventory.length} item stok, dan ${customers.length} pelanggan.`
    );
    return {
      status: 'success',
      mode: 'local',
      message: `Tersimpan dalam database lokal. Masukkan URL Google Apps Script untuk otomatis sinkronisasi ke Google Spreadsheet.`,
      syncedAt: now,
    };
  }

  try {
    const payload = {
      action: 'syncAll',
      jobs,
      inventory,
      customers,
      timestamp: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script CORS friendly
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const result = await res.json();
    if (result?.status === 'error') {
      throw new Error(result.message || 'Gagal menyimpan data di Google Apps Script.');
    }

    const now = new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog('success', 'Berhasil sinkronisasi total ke Google Sheets', `${jobs.length} SPK & ${inventory.length} item stok terkirim.`);

    return {
      status: 'success',
      mode: 'cloud',
      message: result.message || 'Semua data bengkel berhasil disinkronkan ke Google Sheets!',
      syncedAt: now,
      data: result,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? 'Sinkronisasi timeout (lebih dari 20 detik).'
      : error.message || 'Gagal mengirim data ke Google Apps Script';
    addSyncLog('error', 'Gagal sinkronisasi data ke Google Sheets', errText);
    return {
      status: 'error',
      message: errText,
    };
  }
}

/**
 * Otomatis simpan / perbarui 1 item stok material ke sheet STOK_MATERIAL di Google Spreadsheet
 */
export async function saveInventoryItemToAppsScript(item: InventoryItem): Promise<AppsScriptResponse> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    const now = new Date().toISOString();
    addSyncLog(
      'info',
      `Stok ${item.code} disimpan lokal (${item.stock} ${item.unit})`,
      'URL Google Apps Script belum dikonfigurasi.'
    );
    return {
      status: 'success',
      mode: 'local',
      message: `Stok ${item.code} tersimpan di memori lokal. Hubungkan URL Apps Script untuk simpan otomatis ke Google Spreadsheet.`,
      syncedAt: now,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveInventoryItem',
        item,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const result = await res.json();
    if (result?.status === 'error') {
      throw new Error(result.message || 'Google Apps Script gagal menyimpan item stok.');
    }

    const now = result.syncedAt || new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog(
      'success',
      `Stok ${item.code} otomatis tersimpan ke Google Sheets`,
      `${item.name} · ${item.stock} ${item.unit}`
    );

    return {
      status: 'success',
      mode: 'cloud',
      message: result.message || `Stok ${item.code} otomatis tersimpan ke Google Sheets!`,
      syncedAt: now,
      data: result,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? 'Koneksi ke Google Spreadsheet timeout (lebih dari 15 detik).'
      : error.message || 'Gagal menyimpan stok ke Google Spreadsheet.';
    addSyncLog('error', `Gagal auto-save stok ${item.code} ke Google Sheets`, errText);
    return {
      status: 'error',
      mode: 'cloud',
      message: errText,
    };
  }
}

/**
 * Sinkronisasikan seluruh tabel Stok Kawat & Sparepart ke sheet STOK_MATERIAL
 */
export async function syncInventoryToAppsScript(inventory: InventoryItem[]): Promise<AppsScriptResponse> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    return {
      status: 'error',
      mode: 'local',
      message: 'URL Google Apps Script belum diatur.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncInventory',
        inventory,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const result = await res.json();
    if (result?.status === 'error') {
      throw new Error(result.message || 'Gagal menyinkronkan tabel stok ke Google Sheets.');
    }

    const now = result.syncedAt || new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog('success', 'Seluruh stok kawat & sparepart tersinkron ke Google Sheets', `${inventory.length} SKU`);

    return {
      status: 'success',
      mode: 'cloud',
      message: result.message || `${inventory.length} item stok berhasil disimpan ke Google Spreadsheet!`,
      syncedAt: now,
      data: result,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? 'Sinkronisasi stok timeout.'
      : error.message || 'Gagal menyinkronkan stok ke Google Spreadsheet.';
    addSyncLog('error', 'Gagal sinkronisasi stok ke Google Sheets', errText);
    return {
      status: 'error',
      mode: 'cloud',
      message: errText,
    };
  }
}

/**
 * Tarik data stok material terbaru dari sheet STOK_MATERIAL Google Spreadsheet
 */
export async function fetchInventoryFromAppsScript(
  existingItems: InventoryItem[] = []
): Promise<{
  status: 'success' | 'error';
  message: string;
  items?: InventoryItem[];
}> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    return {
      status: 'error',
      message: 'URL Google Apps Script belum diatur.',
    };
  }

  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getInventory` : `${url}?action=getInventory`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const payload = await res.json();
    if (payload?.status === 'error') {
      throw new Error(payload.message || 'Gagal membaca sheet STOK_MATERIAL.');
    }

    const rawRows = Array.isArray(payload.data) ? payload.data : [];
    const items = mapSheetRowsToInventory(rawRows, existingItems);
    const now = new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog('success', 'Data stok dimuat dari Google Sheets', `${items.length} SKU diambil dari STOK_MATERIAL.`);

    return {
      status: 'success',
      message: items.length > 0
        ? `Berhasil memuat ${items.length} item stok dari Google Spreadsheet.`
        : 'Sheet STOK_MATERIAL masih kosong.',
      items,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? 'Timeout saat memuat stok dari Google Spreadsheet.'
      : error.message || 'Gagal memuat stok dari Google Spreadsheet.';
    addSyncLog('error', 'Gagal menarik data stok dari Google Sheets', errText);
    return {
      status: 'error',
      message: errText,
    };
  }
}

/**
 * Tarik data terbaru dari Google Spreadsheet ke aplikasi web
 */
export async function fetchFromAppsScript(): Promise<{
  status: 'success' | 'error';
  message: string;
  data?: {
    jobs?: any[];
    inventory?: any[];
    customers?: any[];
  };
}> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    return {
      status: 'error',
      message: 'URL Google Apps Script belum diatur.',
    };
  }

  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getAll` : `${url}?action=getAll`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const data = await res.json();
    if (data?.status === 'error') {
      throw new Error(data.message || 'Gagal menarik data dari Google Apps Script.');
    }

    addSyncLog('success', 'Berhasil menarik data dari Google Sheets', 'Data tabel termutakhir diunduh.');
    return {
      status: 'success',
      message: 'Berhasil menarik data terbaru dari Google Spreadsheet!',
      data,
    };
  } catch (error: any) {
    const errText = error.message || 'Gagal menarik data dari Google Apps Script';
    addSyncLog('error', 'Gagal menarik data Google Sheets', errText);
    return {
      status: 'error',
      message: errText,
    };
  }
}

/**
 * Otomatis simpan laporan SPK (SPK, Data Teknis Gulungan, Sertifikat QC Megger, dan Tagihan Invoice)
 * ke Google Spreadsheet melalui Google Apps Script
 */
export async function saveJobReportToAppsScript(
  job: JobOrder,
  reportType = 'Laporan SPK'
): Promise<AppsScriptResponse> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    const now = new Date().toISOString();
    addSyncLog(
      'info',
      `${reportType} ${job.id} otomatis tersimpan di database lokal`,
      'URL Google Apps Script belum dikonfigurasi.'
    );
    return {
      status: 'success',
      mode: 'local',
      message: `${reportType} ${job.id} otomatis tersimpan di database lokal. Hubungkan URL Apps Script untuk auto-save ke Google Sheets.`,
      syncedAt: now,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveJobReport',
        reportType,
        job,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const result = await res.json();
    if (result?.status === 'error') {
      throw new Error(result.message || `Google Apps Script gagal menyimpan ${reportType}.`);
    }

    const now = result.syncedAt || new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog(
      'success',
      `${reportType} ${job.id} otomatis tersimpan ke Google Sheets`,
      `${job.customerCompany} · ${job.motorBrand}`
    );

    return {
      status: 'success',
      mode: 'cloud',
      message: result.message || `${reportType} ${job.id} otomatis tersimpan ke database Google Sheets!`,
      syncedAt: now,
      data: result,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? `Koneksi saat menyimpan ${reportType} ${job.id} timeout (lebih dari 15 detik).`
      : error.message || `Gagal menyimpan ${reportType} ${job.id} ke Google Spreadsheet.`;
    addSyncLog('error', `Gagal auto-save ${reportType} ${job.id}`, errText);
    return {
      status: 'error',
      mode: 'cloud',
      message: errText,
    };
  }
}

/**
 * Otomatis simpan data pelanggan baru/terbaru ke sheet DATABASE_PELANGGAN
 */
export async function saveCustomerToAppsScript(customer: Customer): Promise<AppsScriptResponse> {
  const url = getSavedAppsScriptUrl().trim();

  if (!url) {
    const now = new Date().toISOString();
    addSyncLog(
      'info',
      `Pelanggan ${customer.company} otomatis tersimpan di database lokal`,
      'URL Google Apps Script belum dikonfigurasi.'
    );
    return {
      status: 'success',
      mode: 'local',
      message: `Pelanggan ${customer.company} otomatis tersimpan di database lokal. Hubungkan URL Apps Script untuk auto-save ke Google Sheets.`,
      syncedAt: now,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveCustomer',
        customer,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons dengan status ${res.status}`);
    }

    const result = await res.json();
    if (result?.status === 'error') {
      throw new Error(result.message || 'Google Apps Script gagal menyimpan data pelanggan.');
    }

    const now = result.syncedAt || new Date().toISOString();
    setLastSyncTime(now);
    addSyncLog(
      'success',
      `Pelanggan ${customer.company} otomatis tersimpan ke Google Sheets`,
      customer.name
    );

    return {
      status: 'success',
      mode: 'cloud',
      message: result.message || `Data pelanggan ${customer.company} otomatis tersimpan ke Google Sheets!`,
      syncedAt: now,
      data: result,
    };
  } catch (error: any) {
    const errText = error.name === 'AbortError'
      ? `Koneksi saat menyimpan pelanggan ${customer.company} timeout.`
      : error.message || 'Gagal menyimpan data pelanggan ke Google Spreadsheet.';
    addSyncLog('error', `Gagal auto-save pelanggan ${customer.company}`, errText);
    return {
      status: 'error',
      mode: 'cloud',
      message: errText,
    };
  }
}

/**
 * Menyimpan 1 SPK ke Google Apps Script
 */
export async function saveSingleJobToAppsScript(job: JobOrder): Promise<AppsScriptResponse> {
  return saveJobReportToAppsScript(job, 'SPK');
}
