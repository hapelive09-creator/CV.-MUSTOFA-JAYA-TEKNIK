import React from 'react';
import { JobOrder, InventoryItem, Technician } from '../types';
import { formatRupiah } from '../utils/rewindingCalculators';
import { MonthlyRevenueChart } from './MonthlyRevenueChart';
import { RepairCostTrendChart } from './RepairCostTrendChart';
import { JobStatusChart } from './JobStatusChart';
import { TechnicianProductivityChart } from './TechnicianProductivityChart';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  ArrowRight,
  Flame,
  Gauge,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  Cloud,
} from 'lucide-react';

interface DashboardViewProps {
  jobs: JobOrder[];
  inventory: InventoryItem[];
  technicians: Technician[];
  onSelectJob: (job: JobOrder) => void;
  onNavigate: (tab: string) => void;
  onOpenNewJob: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jobs,
  inventory,
  technicians,
  onSelectJob,
  onNavigate,
  onOpenNewJob,
}) => {
  const activeJobs = jobs.filter(
    (j) => j.status !== 'siap_kirim' && j.status !== 'diserahkan'
  );
  const readyOrCompletedJobs = jobs.filter(
    (j) => j.status === 'siap_kirim' || j.status === 'diserahkan'
  );
  const urgentJobs = jobs.filter(
    (j) =>
      (j.priority === 'Emergency 24 Jam' || j.priority === 'Mendesak') &&
      j.status !== 'diserahkan'
  );
  const lowStockItems = inventory.filter((i) => i.stock <= i.minStockAlert);

  const totalActiveRevenue = jobs.reduce((acc, job) => {
    const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
    const parts =
      copperCost +
      job.costs.bearingFrontCost +
      job.costs.bearingRearCost +
      job.costs.insulationAndVarnishCost +
      job.costs.machiningCost;
    const subtotal = parts + job.costs.laborCost;
    return acc + subtotal;
  }, 0);

  // Group by status for workflow distribution
  const statusCounts = {
    antrean: jobs.filter((j) => j.status === 'antrean').length,
    diagnosa: jobs.filter((j) => j.status === 'diagnosa').length,
    gulung: jobs.filter((j) => j.status === 'gulung' || j.status === 'insulasi').length,
    varnish_oven: jobs.filter((j) => j.status === 'varnish_oven').length,
    mekanikal: jobs.filter((j) => j.status === 'mekanikal_bearing').length,
    qc_testing: jobs.filter((j) => j.status === 'qc_testing').length,
    siap_kirim: jobs.filter((j) => j.status === 'siap_kirim').length,
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'Emergency 24 Jam':
        return {
          border: 'border-l-4 border-l-rose-500',
          badge: 'text-rose-700 bg-rose-50 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      case 'Mendesak':
        return {
          border: 'border-l-4 border-l-amber-500',
          badge: 'text-amber-800 bg-amber-50 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      default:
        return {
          border: 'border-l-4 border-l-slate-300',
          badge: 'text-slate-600 bg-slate-50 border-slate-200/80',
          dot: 'bg-slate-400',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'antrean': return 'Penerimaan / Antrean';
      case 'diagnosa': return 'Bongkar & Diagnosa';
      case 'penawaran': return 'Penawaran Biaya';
      case 'insulasi': return 'Insulasi Slot';
      case 'gulung': return 'Proses Gulung';
      case 'koneksi_lacing': return 'Koneksi & Lacing';
      case 'varnish_oven': return 'Varnish & Oven';
      case 'mekanikal_bearing': return 'Mekanikal & Bearing';
      case 'qc_testing': return 'Uji QC & Megger';
      case 'siap_kirim': return 'Selesai & Siap Kirim';
      case 'diserahkan': return 'Telah Diserahkan';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Workshop Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Workshop Operasional Aktif
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">·</span>
              <span className="text-slate-300 text-xs hidden sm:inline font-mono">
                Bekasi Narogong KM 12.5
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
              CV. Mustofa Jaya Teknik
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Pusat Rekayasa, Rewinding & Uji Dinamo Industri Tiga Fasa. Kontrol spesifikasi slot, kawat tembaga email mutu tinggi, perendaman varnish baking oven, hingga sertifikasi isolasi Megger 1000V.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('appscript')}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              Apps Script Cloud
            </button>
            <button
              onClick={() => onNavigate('kanban')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-lg transition-all shadow-xs"
            >
              Lihat Papan Kanban
            </button>
            <button
              onClick={onOpenNewJob}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-sm font-sans"
            >
              + Terima Motor Baru (SPK)
            </button>
          </div>
        </div>

        {/* Mini Workshop Telemetry Bar */}
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Oven Baking Stator:</span>
            <span className="font-mono font-bold text-slate-200">135°C Stabil</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Test Bench 3-Phase:</span>
            <span className="font-mono font-bold text-slate-200">380V Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Insulasi Standar:</span>
            <span className="font-mono font-bold text-amber-300">Class F (155°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-slate-400">Garansi Rewinding:</span>
            <span className="font-mono font-bold text-blue-300">6 Bulan Resmi</span>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Jobs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-amber-500 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Unit Sedang Digarap
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {activeJobs.length} <span className="text-xs font-normal text-slate-400">Motor</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              {urgentJobs.length} unit prioritas tinggi
            </span>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-0.5"
            >
              Lihat <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Completed / Passed QC */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-emerald-500 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Lolos QC & Siap Kirim
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">
                {readyOrCompletedJobs.length} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">Megger &gt; 100 MΩ Lolos Uji</span>
            <button
              onClick={() => onNavigate('qc')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5"
            >
              QC <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: Total Active Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-sky-500 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Estimasi Nilai SPK
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {formatRupiah(totalActiveRevenue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Jasa gulung & material tembaga</span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-sky-700 hover:text-sky-800 font-semibold inline-flex items-center gap-0.5"
            >
              Faktur <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-rose-500 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Peringatan Stok Bahan
              </span>
              <div
                className={`text-2xl md:text-3xl font-extrabold mt-1 font-mono tabular-nums ${
                  lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {lowStockItems.length} <span className="text-xs font-normal text-slate-400">SKU</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 truncate">
              {lowStockItems.length > 0 ? 'Kawat / Bearing menipis' : 'Stok dalam batas aman'}
            </span>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-0.5"
            >
              Restock <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Completed Revenue Bar Chart (Recharts) */}
      <MonthlyRevenueChart
        jobs={jobs}
        onViewJobs={() => onNavigate('jobs')}
        onViewInvoices={() => onNavigate('invoices')}
      />

      {/* Monthly Repair Cost Trend Line Chart (Recharts) */}
      <RepairCostTrendChart
        jobs={jobs}
        onViewJobs={() => onNavigate('jobs')}
        onViewInvoices={() => onNavigate('invoices')}
      />

      {/* Job Status Distribution Bar Chart (Recharts) */}
      <JobStatusChart
        jobs={jobs}
        onViewJobs={() => onNavigate('jobs')}
        onViewKanban={() => onNavigate('kanban')}
      />

      {/* Technician Productivity Pie Chart (Recharts) */}
      <TechnicianProductivityChart
        jobs={jobs}
        technicians={technicians}
        onViewJobs={() => onNavigate('jobs')}
        onViewTeam={() => onNavigate('customers')}
      />

      {/* Production Pipeline: Sleek Connected Workflow */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Alur Kerja Servis Motor Listrik
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi fisik unit motor di lantai workshop CV. Mustofa Jaya Teknik
            </p>
          </div>
          <button
            onClick={() => onNavigate('kanban')}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group"
          >
            Buka Papan Kanban
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 7 Workflow Step Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Step 1 */}
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>01</span>
              <span>Masuk</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate">Antrean Masuk</div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
              {statusCounts.antrean}
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>02</span>
              <span>Bongkar</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate">Bongkar & Cek</div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
              {statusCounts.diagnosa}
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-amber-700 font-mono mb-1">
              <span>03</span>
              <span className="font-semibold">Gulung</span>
            </div>
            <div className="text-xs font-semibold text-amber-900 truncate">Proses Gulung</div>
            <div className="mt-2 text-xl font-bold font-mono text-amber-900 tabular-nums">
              {statusCounts.gulung}
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-lg bg-orange-50/60 border border-orange-200/80 hover:border-orange-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-orange-700 font-mono mb-1">
              <span>04</span>
              <span className="font-semibold">Oven</span>
            </div>
            <div className="text-xs font-semibold text-orange-900 truncate">Varnish & Oven</div>
            <div className="mt-2 text-xl font-bold font-mono text-orange-900 tabular-nums">
              {statusCounts.varnish_oven}
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>05</span>
              <span>Bubut</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate">Bearing & As</div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
              {statusCounts.mekanikal}
            </div>
          </div>

          {/* Step 6 */}
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-blue-700 font-mono mb-1">
              <span>06</span>
              <span className="font-semibold">Megger</span>
            </div>
            <div className="text-xs font-semibold text-blue-900 truncate">Uji QC Megger</div>
            <div className="mt-2 text-xl font-bold font-mono text-blue-900 tabular-nums">
              {statusCounts.qc_testing}
            </div>
          </div>

          {/* Step 7 */}
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-emerald-700 font-mono mb-1">
              <span>07</span>
              <span className="font-semibold">Kirim</span>
            </div>
            <div className="text-xs font-semibold text-emerald-900 truncate">Siap Kirim</div>
            <div className="mt-2 text-xl font-bold font-mono text-emerald-900 tabular-nums">
              {statusCounts.siap_kirim}
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Active Priority Jobs & Technician Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active & Urgent Jobs List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Pekerjaan Prioritas & Unit Aktif
              </h3>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group"
            >
              Semua SPK ({jobs.length})
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.slice(0, 5).map((job) => {
              const priorityStyle = getPriorityIndicator(job.priority);
              const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
              const subtotal = copperCost + job.costs.laborCost;

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`p-4 hover:bg-slate-50/90 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${priorityStyle.border}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {job.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityStyle.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                        {job.priority}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {job.customerCompany}
                      </span>
                    </div>

                    <div className="text-slate-900 font-medium">
                      {job.motorBrand} · {job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM · {job.voltage}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Tag: <span className="font-mono text-slate-700 font-medium">{job.customerUnitTag}</span></span>
                      <span>·</span>
                      <span>Target: <span className="text-slate-700 font-medium">{job.targetDate}</span></span>
                      <span>·</span>
                      <span>Teknisi: <span className="text-slate-700">{job.assignedTechnicians.join(', ')}</span></span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="inline-block px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                      {getStatusLabel(job.status)}
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-900 mt-1 tabular-nums">
                      {formatRupiah(subtotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Technicians On Duty & Precision Standards */}
        <div className="space-y-4">
          {/* Technicians Load */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tim Teknisi Rewinder
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {technicians.length} Personel
              </span>
            </div>
            <div className="space-y-2.5">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200/80 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      {tech.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{tech.name}</div>
                      <div className="text-[11px] text-slate-500">{tech.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-700 text-xs tabular-nums">
                      {tech.activeJobsCount} Unit
                    </span>
                    <div className="text-[10px] text-slate-400">Aktif Digarap</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Standard Blueprint */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Standar Mutu CV. Mustofa Jaya Teknik
            </h3>
            <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Megger Isolasi:</strong> &gt; 100 MΩ pada tegangan injeksi 1000V DC.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Ketidakseimbangan Tahanan:</strong> Maksimal delta 2% fasa U-V-W.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Baking Varnish Oven:</strong> Suhu 130°C - 140°C selama 8-12 jam penuh.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Vibrasi Bearing:</strong> ISO 10816 Zone A (&lt; 1.8 mm/s RMS).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
