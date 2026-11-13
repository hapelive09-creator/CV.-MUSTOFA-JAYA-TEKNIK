import React, { useState } from 'react';
import { Plus, Calculator, Search, Printer, ShieldAlert, Sparkles, Cloud } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenNewJob: () => void;
  onOpenCalculator: () => void;
  onOpenAppsScript?: () => void;
  onPrintPage: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  urgentJobsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenNewJob,
  onOpenCalculator,
  onOpenAppsScript,
  onPrintPage,
  searchQuery,
  onSearchChange,
  urgentJobsCount,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintClick = () => {
    setIsPrinting(true);
    onPrintPage();
    setTimeout(() => setIsPrinting(false), 2000);
  };
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Ringkasan & Monitoring Operasional';
      case 'jobs':
        return 'Surat Perintah Kerja (SPK) & Unit Masuk';
      case 'kanban':
        return 'Alur & Tahapan Kerja Servis Rewinding';
      case 'specs':
        return 'Data Teknis Gulungan & Rekayasa Dinamo';
      case 'qc':
        return 'Uji Kualitas (QC), Megger & Berita Acara';
      case 'inventory':
        return 'Inventori Kawat Email, Bearing & Bahan Isolasi';
      case 'invoices':
        return 'Faktur Tagihan (Invoice) & Penawaran';
      case 'customers':
        return 'Database Pelanggan Industri & Teknisi';
      case 'appscript':
        return 'Integrasi Google Apps Script & Google Sheets';
      default:
        return 'Sistem Manajemen Rewinding';
    }
  };

  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all">
      {/* Zone 1: Contextual Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="text-slate-600 font-semibold tracking-tight">CV. Mustofa Jaya Teknik</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-slate-900 capitalize font-medium">{currentTab}</span>
          {urgentJobsCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200/80">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                {urgentJobsCount} Unit Prioritas
              </span>
            </>
          )}
        </div>
        <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-sans">
          {getTabTitle(currentTab)}
        </h1>
      </div>

      {/* Zone 2 & 3: Search and Action Buttons */}
      <div className="flex items-center flex-wrap gap-2.5">
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SPK, Merk, Pelanggan, Tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
          />
        </div>

        {onOpenAppsScript && (
          <button
            onClick={onOpenAppsScript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            title="Kelola Database Google Apps Script & Google Sheets"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            Apps Script
          </button>
        )}

        <button
          onClick={onOpenCalculator}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          title="Buka Kalkulator Kawat Email & Kesetaraan Kawat"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          Kalkulator Kawat
        </button>

        <button
          onClick={onOpenNewJob}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          Terima Unit (SPK)
        </button>

        <button
          type="button"
          onClick={handlePrintClick}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          title="Cetak Laporan Halaman Ini"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPrinting ? 'Mencetak...' : 'Cetak'}</span>
        </button>
      </div>
    </header>
  );
};
