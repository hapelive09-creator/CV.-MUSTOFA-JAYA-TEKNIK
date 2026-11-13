import React, { useState, useEffect } from 'react';
import { JobOrder, InventoryItem, Customer } from '../types';
import {
  APPS_SCRIPT_CODE_GS,
  generateSheetCsv,
} from '../utils/appsScriptCode';
import {
  buildBackupFilename,
  downloadCsvFile,
  exportInventoryToCsv,
  exportJobOrdersToCsv,
} from '../utils/csvExport';
import {
  getSavedAppsScriptUrl,
  saveAppsScriptUrl,
  testAppsScriptConnection,
  syncAllToAppsScript,
  fetchFromAppsScript,
  getLastSyncTime,
  getSyncLogs,
  SyncLog,
} from '../services/appsScriptService';
import {
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  Link2,
  Terminal,
  Database,
  ShieldCheck,
  ArrowRight,
  Send,
  DownloadCloud,
} from 'lucide-react';

interface AppsScriptViewProps {
  jobs: JobOrder[];
  inventory: InventoryItem[];
  customers: Customer[];
  onDataImported?: (data: { jobs?: JobOrder[]; inventory?: InventoryItem[]; customers?: Customer[] }) => void;
}

export const AppsScriptView: React.FC<AppsScriptViewProps> = ({
  jobs,
  inventory,
  customers,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'code' | 'guide' | 'schema'>('sync');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [backupBanner, setBackupBanner] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = getSavedAppsScriptUrl();
    setAppsScriptUrl(savedUrl);
    setLastSync(getLastSyncTime());
    setLogs(getSyncLogs());
  }, []);

  const handleSaveUrl = () => {
    saveAppsScriptUrl(appsScriptUrl);
    setTestResult({
      status: 'success',
      message: 'URL Google Apps Script berhasil disimpan di memori bengkel.',
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    saveAppsScriptUrl(appsScriptUrl);

    const res = await testAppsScriptConnection(appsScriptUrl);
    setTestResult({
      status: res.status,
      message: res.message,
    });
    setLogs(getSyncLogs());
    setIsTesting(false);
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    const res = await syncAllToAppsScript(jobs, inventory, customers);
    setSyncResult({
      status: res.status,
      message: res.message,
    });
    setLastSync(getLastSyncTime());
    setLogs(getSyncLogs());
    setIsSyncing(false);
  };

  const handleFetchFromSheets = async () => {
    setIsFetching(true);
    setSyncResult(null);

    const res = await fetchFromAppsScript();
    if (res.status === 'success' && res.data) {
      setSyncResult({
        status: 'success',
        message: 'Data berhasil ditarik dari Google Spreadsheet.',
      });
      if (onDataImported) {
        onDataImported(res.data);
      }
    } else {
      setSyncResult({
        status: 'error',
        message: res.message,
      });
    }
    setLogs(getSyncLogs());
    setIsFetching(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_GS);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadCodeGs = () => {
    const blob = new Blob([APPS_SCRIPT_CODE_GS], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = (type: 'SPK' | 'SPECS' | 'QC' | 'INVENTORY' | 'INVOICES' | 'CUSTOMERS') => {
    const csvContent = generateSheetCsv(type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_MUSTOFA_${type}_TEMPLATE.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackupLiveJobsCsv = () => {
    const csv = exportJobOrdersToCsv(jobs);
    const filename = buildBackupFilename('job-orders');
    downloadCsvFile(csv, filename);
    setBackupBanner(`Backup Job Order berhasil diunduh: ${filename} (${jobs.length} SPK)`);
  };

  const handleBackupLiveInventoryCsv = () => {
    const csv = exportInventoryToCsv(inventory);
    const filename = buildBackupFilename('inventori');
    downloadCsvFile(csv, filename);
    setBackupBanner(`Backup Inventori berhasil diunduh: ${filename} (${inventory.length} SKU)`);
  };

  return (
    <div className="space-y-6">
      {/* Top Industrial Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-xl border border-slate-800 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                Backend Google Apps Script & Google Sheets
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">·</span>
              <span className="text-slate-300 text-xs hidden sm:inline font-mono">
                {appsScriptUrl ? 'Mode Cloud Terhubung' : 'Mode Offline / Penyimpanan Lokal'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
              Integrasi Google Apps Script (GAS)
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Sinkronkan seluruh data bengkel CV. Mustofa Jaya Teknik secara langsung ke Google Spreadsheet. Database cloud bebas biaya, multi-pengguna, otomatis menyimpan riwayat SPK, data teknis gulungan, sertifikat QC, dan stok kawat tembaga.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan...' : 'Kirim Data ke Google Sheets'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200/80 bg-white p-1.5 rounded-xl border gap-1.5 text-xs shadow-2xs">
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'sync'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          Koneksi & Sinkronisasi Live
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'code'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Kode Code.gs (Salin & Unduh)
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'guide'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Panduan Setup 3 Menit
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'schema'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Struktur Sheet & Ekspor CSV
        </button>
      </div>

      {/* TAB 1: KONEKSI & SINKRONISASI LIVE */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* URL Input Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pengaturan URL Google Apps Script Web App
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan URL deployment Web App Apps Script (berakhiran <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">/exec</code>) dari Google Spreadsheet bengkel.
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                  appsScriptUrl
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {appsScriptUrl ? 'URL Terkonfigurasi' : 'Belum Ada URL'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                Simpan URL
              </button>

              <button
                onClick={handleTestConnection}
                disabled={isTesting || !appsScriptUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap disabled:opacity-50"
              >
                {isTesting ? 'Menguji...' : 'Uji Koneksi (Ping)'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Sync Trigger Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-amber-500 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kirim Data ke Google Sheets
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  Sinkronisasi Database Penuh
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Kirim {jobs.length} SPK, seluruh lembar data teknis alur & kawat, laporan megger QC, {inventory.length} item stok, dan data pelanggan ke Google Spreadsheet.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSyncing ? 'Mengirim Data...' : 'Kirim Sekarang'}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-sky-500 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tarik Data dari Google Sheets
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  Perbarui dari Spreadsheet
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ambil pembaruan terkini jika ada teknisi atau staf administrasi yang mengedit data langsung di Google Spreadsheet bengkel.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleFetchFromSheets}
                  disabled={isFetching || !appsScriptUrl}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-sky-600" />
                  {isFetching ? 'Mengunduh...' : 'Tarik Data Terkini'}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-emerald-500 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Status Cloud Bengkel
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Siap Digunakan
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div>Terakhir Sinkron: <strong>{lastSync ? new Date(lastSync).toLocaleString('id-ID') : 'Belum Pernah'}</strong></div>
                  <div>Penyimpanan: <strong>Google Spreadsheet + LocalStorage</strong></div>
                  <div>Keamanan: <strong>Restricted to Workshop Domain / Open WebApp</strong></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Versi GAS: <strong>2.5.0</strong></span>
                <span className="text-emerald-700 font-semibold font-mono">CORS Active</span>
              </div>
            </div>
          </div>

          {syncResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                syncResult.status === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {syncResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Manual CSV Backup Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Backup Data Manual ke CSV (Offline)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh salinan data operasional aktual (Job Order SPK dan Stok Inventori) ke file <code className="font-mono text-slate-700">.csv</code> yang siap dibuka di Excel atau Google Sheets.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleBackupLiveJobsCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  Backup CSV Job Order ({jobs.length} SPK)
                </button>
                <button
                  type="button"
                  onClick={handleBackupLiveInventoryCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Backup CSV Inventori ({inventory.length} SKU)
                </button>
              </div>
            </div>

            {backupBanner && (
              <div
                role="status"
                className="p-2.5 rounded-lg text-xs flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{backupBanner}</span>
              </div>
            )}
          </div>

          {/* Sync History Logs */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Riwayat Log Sinkronisasi Google Apps Script
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {logs.length} Aktivitas Terakhir
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Belum ada aktivitas sinkronisasi yang tercatat.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/70">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          log.type === 'success'
                            ? 'bg-emerald-500'
                            : log.type === 'error'
                            ? 'bg-rose-500'
                            : 'bg-sky-500'
                        }`}
                      />
                      <div>
                        <div className="text-slate-800 font-sans font-medium">{log.message}</div>
                        {log.details && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-lg">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE.GS SCRIPT SOURCE */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Source Code Google Apps Script (<code className="font-mono text-amber-700">Code.gs</code>)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin seluruh kode ini ke Google Apps Script editor di Google Spreadsheet Anda, lalu klik Simpan & Deploy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all whitespace-nowrap"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}
              </button>

              <button
                onClick={handleDownloadCodeGs}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh File Code.gs
              </button>
            </div>
          </div>

          <div className="bg-[#0B1120] rounded-xl border border-slate-800 p-4 overflow-hidden shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-amber-400 font-semibold">Code.gs (Apps Script Industrial Backend)</span>
              <span>JavaScript / Google Apps Script V8 Runtime</span>
            </div>
            <pre className="text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] p-2">
              <code>{APPS_SCRIPT_CODE_GS}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PANDUAN SETUP 3 MENIT */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Panduan Pemasangan Google Apps Script (3 Langkah Mudah)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ikuti panduan berikut untuk menghubungkan sistem bengkel CV. Mustofa Jaya Teknik dengan Google Sheets Anda:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center font-mono mb-3">
                  01
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Buka Google Spreadsheet
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold">sheets.new</a> untuk membuat spreadsheet kosong baru. Beri judul dokumen: <strong>"Database CV Mustofa Jaya Teknik"</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500">
                Tip: Tidak perlu membuat sheet secara manual, script akan otomatis membuatnya.
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono mb-3">
                  02
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Buka Apps Script & Paste Kode
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Pada Google Spreadsheet, klik menu <strong>Ekstensi &gt; Apps Script</strong>. Hapus isi fungsi bawaan, lalu salin dan tempelkan seluruh kode dari tab <strong>"Kode Code.gs"</strong>. Tekan tombol <strong>Simpan (Ctrl+S)</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500">
                Pilih fungsi <code className="font-mono text-emerald-700 font-semibold">setupDatabaseSheets</code> dan klik <strong>Jalankan</strong> jika ingin menyiapkan tabel awal.
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center font-mono mb-3">
                  03
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deploy sebagai Web App
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Klik tombol biru <strong>Terapkan (Deploy) &gt; Deployment baru</strong>. Pilih jenis <strong>Aplikasi web</strong>. Pada opsi <em>Akses</em>, pilih <strong>Siapa saja (Anyone)</strong>. Klik Terapkan lalu salin URL Web App yang muncul.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500">
                Tempelkan URL Web App tersebut ke formulir di Tab <strong>"Koneksi & Sinkronisasi"</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRUKTUR SHEET & EKSPOR CSV */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Struktur 6 Tabel Google Spreadsheet CV. Mustofa Jaya Teknik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur kolom standar yang dibuat otomatis oleh Google Apps Script. Anda juga dapat mengunduh template CSV untuk dibuka di Google Sheets atau Excel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sheet 1 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                    SPK_JOBS
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">23 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Surat Perintah Kerja (SPK)</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mencatat nomor SPK, pabrik, daya motor, RPM, voltase, status pengerjaan, prioritas teknisi, biaya total, dan pembayaran.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleBackupLiveJobsCsv}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                >
                  <Download className="w-3 h-3 text-amber-700" />
                  Ekspor CSV Data SPK ({jobs.length} Unit)
                </button>
                <button
                  onClick={() => handleDownloadCsv('SPK')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-amber-600" />
                  Unduh Template CSV SPK
                </button>
              </div>
            </div>

            {/* Sheet 2 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                    DATA_TEKNIS_GULUNGAN
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">12 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Spesifikasi Gulungan Stator</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jumlah alur/slot stator, pitch span, diameter kawat email tembaga, paralel kawat, lilitan, berat kg, dan bearing DE/NDE.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadCsv('SPECS')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  Unduh Template CSV Data Teknis
                </button>
              </div>
            </div>

            {/* Sheet 3 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    LAPORAN_QC_MEGGER
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">25 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Sertifikat Kelayakan & Megger</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tahanan isolasi megger 1000V DC (&gt;100 MΩ), delta keseimbangan fasa (&lt;2%), arus no-load 3-fasa, getaran ISO 10816, dan masa garansi.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadCsv('QC')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-600" />
                  Unduh Template CSV QC Megger
                </button>
              </div>
            </div>

            {/* Sheet 4 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/80">
                    STOK_MATERIAL
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">9 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Inventori Kawat & Sparepart</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Katalog SKU kawat email Supreme, bearing SKF, kertas isolasi Nomex, pernis Dr. Beck, stok fisik, dan peringatan minimum.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleBackupLiveInventoryCsv}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-700" />
                  Ekspor CSV Data Stok ({inventory.length} SKU)
                </button>
                <button
                  onClick={() => handleDownloadCsv('INVENTORY')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-sky-600" />
                  Unduh Template CSV Stok
                </button>
              </div>
            </div>

            {/* Sheet 5 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                    TAGIHAN_INVOICE
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">13 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Rekap Faktur & Keuangan</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nomor faktur, rincian biaya jasa gulung vs suku cadang, PPN 11%, pembayaran uang muka (DP), dan saldo piutang.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadCsv('INVOICES')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-indigo-600" />
                  Unduh Template CSV Invoice
                </button>
              </div>
            </div>

            {/* Sheet 6 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                    DATABASE_PELANGGAN
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">8 Kolom</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Pelanggan Industri</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Data perusahaan pabrik, nama PIC maintenance, kontak WhatsApp, email, dan alamat fasilitas pabrik.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleDownloadCsv('CUSTOMERS')}
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/80 transition-colors"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  Unduh Template CSV Pelanggan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
