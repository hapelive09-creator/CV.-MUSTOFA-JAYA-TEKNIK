import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryCategory, JobOrder } from '../types';
import { formatRupiah } from '../utils/rewindingCalculators';
import { parseStockInput } from '../utils/inventoryHelpers';
import {
  buildBackupFilename,
  downloadCsvFile,
  exportInventoryToCsv,
} from '../utils/csvExport';
import { WireUsageTrendChart } from './WireUsageTrendChart';
import {
  AppsScriptResponse,
  fetchInventoryFromAppsScript,
  getLastSyncTime,
  getSavedAppsScriptUrl,
  isValidAppsScriptUrl,
  saveAppsScriptUrl,
  saveInventoryItemToAppsScript,
  syncInventoryToAppsScript,
} from '../services/appsScriptService';
import {
  Search,
  AlertTriangle,
  Pencil,
  Save,
  X,
  Check,
  MapPin,
  Cloud,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
  Link2,
  FileSpreadsheet,
  RotateCcw,
  Download,
} from 'lucide-react';

interface RowSyncStatus {
  state: 'saving' | 'saved_cloud' | 'saved_local' | 'error';
  message: string;
}

interface InventoryViewProps {
  inventory: InventoryItem[];
  jobs: JobOrder[];
  onUpdateStock: (itemId: string, newStock: number) => Promise<AppsScriptResponse>;
  onAddNewItem: (item: InventoryItem) => Promise<AppsScriptResponse>;
  onReplaceInventory: (items: InventoryItem[]) => void;
  onOpenAppsScript: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  jobs,
  onUpdateStock,
  onAddNewItem,
  onReplaceInventory,
  onOpenAppsScript,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftStock, setDraftStock] = useState<string>('');
  const [stockError, setStockError] = useState<string | null>(null);
  const [rowSyncStatus, setRowSyncStatus] = useState<Record<string, RowSyncStatus>>({});
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Google Spreadsheet / Apps Script Auto-Save state
  const [sheetUrl, setSheetUrl] = useState<string>(() => getSavedAppsScriptUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState<string>(() => getSavedAppsScriptUrl());
  const [urlError, setUrlError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => getLastSyncTime());
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetBanner, setSheetBanner] = useState<{
    status: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    setSheetUrl(getSavedAppsScriptUrl());
    setLastSyncAt(getLastSyncTime());
  }, []);

  const isCloudConnected = sheetUrl.trim().length > 0;

  const clearRowStatusSoon = (itemId: string, expectedState: RowSyncStatus['state'], delayMs: number) => {
    setTimeout(() => {
      setRowSyncStatus((prev) => {
        if (prev[itemId]?.state !== expectedState) return prev;
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }, delayMs);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setDraftStock(String(item.stock));
    setStockError(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setDraftStock('');
    setStockError(null);
  };

  const handleSaveEdit = async (item: InventoryItem) => {
    const parsed = parseStockInput(draftStock);
    if (!parsed.valid) {
      setStockError(parsed.error || 'Angka stok tidak valid');
      return;
    }

    const activeCloud = getSavedAppsScriptUrl().trim().length > 0;
    setEditingItemId(null);
    setDraftStock('');
    setStockError(null);

    if (activeCloud) {
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: { state: 'saving', message: 'Menyimpan ke Sheets...' },
      }));
    }

    const res = await onUpdateStock(item.id, parsed.value);

    if (res.status === 'success' && res.mode === 'cloud') {
      setLastSyncAt(res.syncedAt || new Date().toISOString());
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: { state: 'saved_cloud', message: 'Tersimpan ke Google Sheets' },
      }));
      clearRowStatusSoon(item.id, 'saved_cloud', 3500);
    } else if (res.status === 'success') {
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: { state: 'saved_local', message: 'Tersimpan Lokal' },
      }));
      clearRowStatusSoon(item.id, 'saved_local', 2500);
    } else {
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: {
          state: 'error',
          message: res.message || 'Gagal simpan ke Sheets',
        },
      }));
    }
  };

  const handleRetryRowSync = async (item: InventoryItem) => {
    setRowSyncStatus((prev) => ({
      ...prev,
      [item.id]: { state: 'saving', message: 'Menyimpan ulang...' },
    }));

    const res = await saveInventoryItemToAppsScript(item);
    if (res.status === 'success' && res.mode === 'cloud') {
      setLastSyncAt(res.syncedAt || new Date().toISOString());
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: { state: 'saved_cloud', message: 'Tersimpan ke Google Sheets' },
      }));
      clearRowStatusSoon(item.id, 'saved_cloud', 3500);
    } else {
      setRowSyncStatus((prev) => ({
        ...prev,
        [item.id]: {
          state: 'error',
          message: res.message || 'Gagal simpan ke Sheets',
        },
      }));
    }
  };

  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      saveAppsScriptUrl('');
      setSheetUrl('');
      setUrlError(null);
      setIsEditingUrl(false);
      setSheetBanner({
        status: 'info',
        message: 'Koneksi Google Spreadsheet dilepas. Penyimpanan kembali ke mode lokal.',
      });
      return;
    }

    if (!isValidAppsScriptUrl(trimmed)) {
      setUrlError('Masukkan URL Web App Google Apps Script yang valid (dimulai dengan https://).');
      return;
    }

    saveAppsScriptUrl(trimmed);
    setSheetUrl(trimmed);
    setUrlError(null);
    setIsEditingUrl(false);
    setSheetBanner({
      status: 'success',
      message: 'URL Google Spreadsheet aktif! Setiap klik Simpan pada stok akan otomatis tersimpan ke sheet STOK_MATERIAL.',
    });
  };

  const handleBatchSyncAll = async () => {
    setIsBatchSyncing(true);
    setSheetBanner(null);
    const res = await syncInventoryToAppsScript(inventory);
    setIsBatchSyncing(false);
    if (res.status === 'success') {
      setLastSyncAt(res.syncedAt || new Date().toISOString());
      setSheetBanner({ status: 'success', message: res.message });
    } else {
      setSheetBanner({ status: 'error', message: res.message });
    }
  };

  const handlePullFromSheet = async () => {
    setIsFetchingSheet(true);
    setSheetBanner(null);
    const res = await fetchInventoryFromAppsScript(inventory);
    setIsFetchingSheet(false);
    if (res.status === 'success' && res.items) {
      if (res.items.length > 0) {
        onReplaceInventory(res.items);
      }
      setLastSyncAt(getLastSyncTime());
      setSheetBanner({ status: 'success', message: res.message });
    } else {
      setSheetBanner({ status: 'error', message: res.message });
    }
  };

  // New Item State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    code: '',
    name: '',
    category: 'Kawat Email',
    stock: 10,
    unit: 'kg',
    minStockAlert: 5,
    unitPrice: 195000,
    location: 'Rak Tembaga A-1',
  });

  const categories: InventoryCategory[] = [
    'Kawat Email',
    'Bahan Isolasi',
    'Bearing',
    'Varnish & Kimia',
    'Kabel & Terminal',
    'Lainnya',
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = inventory.filter((i) => i.stock <= i.minStockAlert);
  const totalValuation = inventory.reduce(
    (acc, curr) => acc + curr.stock * curr.unitPrice,
    0
  );

  const handleExportInventoryCsv = () => {
    if (filteredItems.length === 0) return;
    const csv = exportInventoryToCsv(filteredItems);
    const filename = buildBackupFilename('inventori');
    downloadCsvFile(csv, filename);
    setBackupNotice(
      `Backup CSV inventori berhasil diunduh: ${filename} (${filteredItems.length} SKU)`
    );
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.code) return;

    const created: InventoryItem = {
      id: `INV-${Date.now()}`,
      code: newItem.code || 'ITEM-NEW',
      name: newItem.name || '',
      category: (newItem.category as InventoryCategory) || 'Kawat Email',
      stock: Number(newItem.stock) || 0,
      unit: newItem.unit || 'pcs',
      minStockAlert: Number(newItem.minStockAlert) || 5,
      unitPrice: Number(newItem.unitPrice) || 0,
      location: newItem.location || 'Gudang Utama',
    };

    setShowAddModal(false);
    setNewItem({
      code: '',
      name: '',
      category: 'Kawat Email',
      stock: 10,
      unit: 'kg',
      minStockAlert: 5,
      unitPrice: 195000,
      location: 'Rak Tembaga A-1',
    });

    if (isCloudConnected) {
      setRowSyncStatus((prev) => ({
        ...prev,
        [created.id]: { state: 'saving', message: 'Menyimpan ke Sheets...' },
      }));
    }

    const res = await onAddNewItem(created);
    if (res.status === 'success' && res.mode === 'cloud') {
      setLastSyncAt(res.syncedAt || new Date().toISOString());
      setRowSyncStatus((prev) => ({
        ...prev,
        [created.id]: { state: 'saved_cloud', message: 'Tersimpan ke Google Sheets' },
      }));
      clearRowStatusSoon(created.id, 'saved_cloud', 3500);
    } else if (res.status === 'success') {
      setRowSyncStatus((prev) => ({
        ...prev,
        [created.id]: { state: 'saved_local', message: 'Tersimpan Lokal' },
      }));
      clearRowStatusSoon(created.id, 'saved_local', 2500);
    } else {
      setRowSyncStatus((prev) => ({
        ...prev,
        [created.id]: {
          state: 'error',
          message: res.message || 'Gagal simpan ke Sheets',
        },
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-slate-500 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Item Stok Material
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
            {inventory.length} <span className="text-xs font-normal text-slate-400">SKU</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Kawat tembaga email, bearing & isolasi
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-sky-500 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Valuasi Nilai Stok
          </span>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
            {formatRupiah(totalValuation)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Berdasarkan harga perolehan bahan bengkel
          </div>
        </div>

        <div
          className={`p-5 rounded-xl border shadow-2xs border-t-3 ${
            lowStockItems.length > 0
              ? 'bg-rose-50/40 border-rose-200/90 border-t-rose-500'
              : 'bg-white border-slate-200/90 border-t-emerald-500'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Peringatan Stok Menipis
          </span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1 font-mono tabular-nums">
            {lowStockItems.length} <span className="text-xs font-normal text-rose-600">Perlu Restock</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-2 pt-2 border-t border-rose-100">
            Segera pesan ke distributor kawat & bearing
          </div>
        </div>
      </div>

      {/* Google Spreadsheet Auto-Save Database Bar */}
      <div
        className={`rounded-xl border p-4 shadow-2xs transition-colors ${
          isCloudConnected
            ? 'bg-emerald-50/50 border-emerald-200/90'
            : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                isCloudConnected
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  Database Google Spreadsheet (<span className="font-mono">STOK_MATERIAL</span>)
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    isCloudConnected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  {isCloudConnected
                    ? 'Terhubung · Auto-Save Aktif'
                    : 'Mode Lokal · Belum Terhubung'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isCloudConnected ? (
                  <>
                    Setiap klik <strong>Simpan</strong> otomatis memperbarui baris SKU di Google Spreadsheet.
                    {lastSyncAt && (
                      <span className="text-slate-500 ml-1.5 font-mono">
                        · Sinkron terakhir: {new Date(lastSyncAt).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </>
                ) : (
                  'Pasang URL Web App Google Apps Script agar setiap perubahan stok otomatis tersimpan ke Google Spreadsheet.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCloudConnected && (
              <>
                <button
                  type="button"
                  onClick={handleBatchSyncAll}
                  disabled={isBatchSyncing || isFetchingSheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isBatchSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  {isBatchSyncing ? 'Mengirim...' : 'Kirim Semua ke Sheets'}
                </button>
                <button
                  type="button"
                  onClick={handlePullFromSheet}
                  disabled={isFetchingSheet || isBatchSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <DownloadCloud className={`w-3.5 h-3.5 text-sky-600 ${isFetchingSheet ? 'animate-pulse' : ''}`} />
                  {isFetchingSheet ? 'Memuat...' : 'Tarik dari Sheets'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setUrlInput(sheetUrl);
                setUrlError(null);
                setIsEditingUrl((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-600" />
              {isCloudConnected ? 'Ubah URL Spreadsheet' : 'Atur URL Spreadsheet'}
            </button>

            <button
              type="button"
              onClick={onOpenAppsScript}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Kode Code.gs & Panduan
            </button>
          </div>
        </div>

        {/* Inline Apps Script Web App URL Form */}
        {isEditingUrl && (
          <form onSubmit={handleSaveSheetUrl} className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
            <label
              htmlFor="inventory-apps-script-url"
              className="block text-[11px] font-semibold text-slate-700"
            >
              URL Web App Google Apps Script (berakhiran <code className="font-mono text-amber-700">/exec</code>):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="inventory-apps-script-url"
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Simpan & Aktifkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingUrl(false);
                    setUrlError(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Batal
                </button>
              </div>
            </div>
            {urlError && (
              <p className="text-[11px] font-medium text-rose-600">{urlError}</p>
            )}
          </form>
        )}

        {sheetBanner && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
              sheetBanner.status === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : sheetBanner.status === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <span>{sheetBanner.message}</span>
            <button
              type="button"
              onClick={() => setSheetBanner(null)}
              aria-label="Tutup notifikasi sinkronisasi"
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Warning Alert Strip if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/90 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian Logistik Bengkel:</strong> Ada {lowStockItems.length} material yang di bawah batas minimum: {lowStockItems.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(', ')}.
            </span>
          </div>
        </div>
      )}

      {/* Recharts Historical Enamel Wire Usage Trend */}
      <WireUsageTrendChart jobs={jobs} inventory={inventory} />

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama kawat, bearing, lokasi rak..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          >
            <option value="all">Semua Kategori Bahan</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleExportInventoryCsv}
            disabled={filteredItems.length === 0}
            aria-label="Ekspor Inventori ke CSV"
            title="Unduh backup data stok kawat & sparepart dalam format CSV"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor CSV ({filteredItems.length})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            + Tambah Material Baru
          </button>
        </div>
      </div>

      {backupNotice && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBackupNotice(null)}
            aria-label="Tutup notifikasi ekspor CSV inventori"
            className="text-emerald-700 hover:text-emerald-950 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Material / Spesifikasi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Stok Fisik Saat Ini</th>
                <th className="py-3 px-4 text-right">Harga Satuan</th>
                <th className="py-3 px-4 text-right">Total Nilai</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-center">Edit &amp; Simpan Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.stock <= item.minStockAlert;
                const isEditing = editingItemId === item.id;
                const syncInfo = rowSyncStatus[item.id];
                const isSavingRow = syncInfo?.state === 'saving';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${isLow ? 'bg-rose-50/25' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Batas Minimum: {item.minStockAlert} {item.unit}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200/80 whitespace-nowrap inline-block">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isEditing ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              autoFocus
                              aria-label={`Jumlah stok ${item.name}`}
                              value={draftStock}
                              onChange={(e) => {
                                setDraftStock(e.target.value);
                                if (stockError) setStockError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEdit(item);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEdit();
                                }
                              }}
                              className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-amber-400 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900"
                            />
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.unit}
                            </span>
                          </div>
                          {stockError && (
                            <span className="text-[10px] font-medium text-rose-600">
                              {stockError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`font-mono font-bold text-xs tabular-nums px-2.5 py-1 rounded-md inline-block ${
                              isLow
                                ? 'text-rose-700 bg-rose-100 border border-rose-200'
                                : 'text-slate-900 bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            {item.stock} {item.unit}
                          </span>
                          {syncInfo?.state === 'saving' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              {syncInfo.message}
                            </span>
                          )}
                          {syncInfo?.state === 'saved_cloud' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                              <Check className="w-3 h-3" />
                              {syncInfo.message}
                            </span>
                          )}
                          {syncInfo?.state === 'saved_local' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-600">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {syncInfo.message}
                            </span>
                          )}
                          {syncInfo?.state === 'error' && (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-medium text-rose-600">
                                {syncInfo.message} (Tersimpan lokal)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRetryRowSync(item)}
                                aria-label={`Coba lagi simpan ${item.code} ke Google Sheets`}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Coba Lagi
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatRupiah(item.unitPrice)} / {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(item.stock * item.unitPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.location}
                      </span>
                    </td>

                    {/* Stock Edit & Save Controls */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            aria-label={`Batal edit stok ${item.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors whitespace-nowrap shrink-0"
                            title="Batalkan perubahan stok"
                          >
                            <X className="w-3 h-3" />
                            Batal
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSavingRow}
                            onClick={() => handleStartEdit(item)}
                            aria-label={`Edit stok ${item.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-amber-800 bg-white hover:bg-amber-50 rounded-md border border-slate-200/90 hover:border-amber-300 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                            title="Edit jumlah stok"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!isEditing || isSavingRow}
                          onClick={() => handleSaveEdit(item)}
                          aria-label={`Simpan stok ${item.name}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                            isEditing && !isSavingRow
                              ? 'text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-2xs'
                              : 'text-slate-400 bg-slate-50 border-slate-200/70 cursor-not-allowed'
                          }`}
                          title={
                            isEditing
                              ? isCloudConnected
                                ? 'Simpan & otomatis kirim ke Google Spreadsheet'
                                : 'Simpan perubahan stok'
                              : 'Klik Edit terlebih dahulu'
                          }
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Tambah Material / Suku Cadang Baru ke Inventori
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode SKU:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KW-120"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Material Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kawat Email Supreme Ø 1.20 mm (SWG 18)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stok Awal:</label>
                  <input
                    type="number"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan:</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  >
                    <option value="kg">kg</option>
                    <option value="pcs">pcs</option>
                    <option value="roll">roll</option>
                    <option value="meter">meter</option>
                    <option value="kaleng">kaleng</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas Minimum:</label>
                  <input
                    type="number"
                    value={newItem.minStockAlert}
                    onChange={(e) => setNewItem({ ...newItem, minStockAlert: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Satuan (Rp):</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lokasi Penyimpanan:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rak Tembaga A-3"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
