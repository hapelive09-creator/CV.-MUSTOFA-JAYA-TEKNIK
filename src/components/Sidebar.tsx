import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Kanban,
  FileSpreadsheet,
  CheckCircle2,
  Calculator,
  Boxes,
  Receipt,
  Users,
  Zap,
  PhoneCall,
  Flame,
  Gauge,
  Sparkles,
  Cloud,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeJobsCount: number;
  lowStockCount: number;
  pendingQCCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeJobsCount,
  lowStockCount,
  pendingQCCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Ringkasan Bengkel',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'jobs',
      label: 'SPK & Unit Masuk',
      icon: ClipboardList,
      badge: activeJobsCount > 0 ? `${activeJobsCount}` : null,
    },
    {
      id: 'kanban',
      label: 'Alur Tahapan Kerja',
      icon: Kanban,
      badge: null,
    },
    {
      id: 'specs',
      label: 'Data Teknis Gulungan',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'qc',
      label: 'Uji QC & Megger',
      icon: CheckCircle2,
      badge: pendingQCCount > 0 ? `${pendingQCCount} Uji` : null,
    },
    {
      id: 'calculator',
      label: 'Kalkulator Kawat & Daya',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Stok Kawat & Sparepart',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : null,
    },
    {
      id: 'invoices',
      label: 'Invoice & Penawaran',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Pelanggan & Teknisi',
      icon: Users,
      badge: null,
    },
    {
      id: 'appscript',
      label: 'Integrasi Apps Script',
      icon: Cloud,
      badge: 'Google Sheets',
    },
  ];

  return (
    <aside className="no-print w-64 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/80 select-none transition-all">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-[#0F172A] to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-amber-700/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5 fill-amber-400/90 text-amber-300" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B1120]"></div>
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wider uppercase font-sans">
              CV. MUSTOFA JAYA
            </div>
            <div className="text-[11px] font-semibold text-amber-400/90 tracking-widest uppercase">
              TEKNIK REWINDING
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-normal">
          Sistem Operasional Gulung Dinamo & Overhaul Motor Listrik Industri
        </p>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
          Menu Operasional
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 font-semibold border-l-2 border-amber-500 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Workshop Telemetry & Status Widget */}
      <div className="p-3.5 m-3 rounded-xl border border-slate-800 bg-[#0F172A]/80 backdrop-blur-xs space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Oven Baking
          </span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
            135°C Stabil
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            Bench Test
          </span>
          <span className="font-mono text-slate-300 font-semibold text-[10px]">
            3-Phase 380V
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <PhoneCall className="w-3 h-3 text-amber-400/80 shrink-0" />
            <span>0812-8877-6652</span>
          </span>
          <span className="font-mono text-slate-400 text-[9px] uppercase tracking-wider">
            Bekasi
          </span>
        </div>
      </div>
    </aside>
  );
};
