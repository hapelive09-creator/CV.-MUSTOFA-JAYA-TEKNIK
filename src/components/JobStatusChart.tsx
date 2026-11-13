import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart2, ArrowRight, ClipboardList } from 'lucide-react';
import { JobOrder } from '../types';
import {
  calculateJobStatusDistribution,
  JobStatusDatum,
  JobStatusFilterMode,
} from '../utils/jobStatusAnalytics';

interface JobStatusChartProps {
  jobs: JobOrder[];
  onViewJobs?: () => void;
  onViewKanban?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: JobStatusDatum }>;
}

const CustomStatusTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[225px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <span className="font-bold text-slate-100">{datum.label}</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {datum.phase}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">
          Jumlah Unit SPK
        </span>
        <span className="text-base font-extrabold font-mono text-white tabular-nums">
          {datum.count} SPK{' '}
          <span className="text-[11px] font-normal text-slate-400">
            ({datum.sharePct}%)
          </span>
        </span>
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Total Kapasitas Daya</span>
          <span className="font-mono tabular-nums font-semibold">
            {datum.totalPowerHp} HP
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-amber-300">
          <span>Prioritas Mendesak / Emergency</span>
          <span className="font-mono tabular-nums font-semibold">
            {datum.urgentCount} Unit
          </span>
        </div>
        {datum.sampleIds.length > 0 && (
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            No. SPK: {datum.sampleIds.join(', ')}
            {datum.count > datum.sampleIds.length ? '…' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export const JobStatusChart: React.FC<JobStatusChartProps> = ({
  jobs,
  onViewJobs,
  onViewKanban,
}) => {
  const [filterMode, setFilterMode] = useState<JobStatusFilterMode>('all');
  const [isCompact, setIsCompact] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const summary = useMemo(
    () => calculateJobStatusDistribution(jobs, { filterMode }),
    [jobs, filterMode]
  );

  const isFilteredEmpty = summary.data.length === 0 || summary.totalJobs === 0;

  return (
    <section
      aria-labelledby="job-status-chart-heading"
      className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      {/* Header Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-600 shrink-0" />
            <h3
              id="job-status-chart-heading"
              className="text-sm font-bold text-slate-900 tracking-tight"
            >
              Ringkasan Jumlah SPK Berdasarkan Status Pekerjaan
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sebaran unit motor listrik pada setiap tahapan bengkel untuk memantau beban antrean dan progres penyelesaian
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start xl:self-auto shrink-0">
          <div
            role="group"
            aria-label="Filter tampilan status SPK"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0"
          >
            <button
              type="button"
              aria-pressed={filterMode === 'all'}
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              aria-pressed={filterMode === 'in_progress'}
              onClick={() => setFilterMode('in_progress')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'in_progress'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sedang Dikerjakan
            </button>
            <button
              type="button"
              aria-pressed={filterMode === 'non_empty'}
              onClick={() => setFilterMode('non_empty')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'non_empty'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hanya Terisi
            </button>
          </div>

          {onViewKanban && (
            <button
              type="button"
              onClick={onViewKanban}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group whitespace-nowrap shrink-0"
            >
              Papan Kanban
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-slate-50/80 border border-slate-200/70 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total SPK Terdaftar
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="status-chart-total-jobs"
              className="text-lg font-extrabold text-slate-900 font-mono tabular-nums"
            >
              {summary.totalJobs} SPK
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              · {summary.completedJobsCount} Selesai
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Dalam Pengerjaan Workshop
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="status-chart-active-jobs"
              className="text-lg font-extrabold text-amber-700 font-mono tabular-nums"
            >
              {summary.activeJobsCount} Unit
            </span>
            <span className="text-xs text-slate-600">
              di {summary.activeStageCount} tahap aktif
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tahap Beban Aktif Tertinggi
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="status-chart-bottleneck"
              className="text-sm font-bold text-slate-900 truncate"
            >
              {summary.bottleneckStage
                ? `${summary.bottleneckStage.label} (${summary.bottleneckStage.count} SPK)`
                : 'Semua Unit Selesai'}
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Area or Empty State */}
      {isFilteredEmpty ? (
        <div
          data-testid="job-status-chart-empty"
          className="h-[250px] flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
        >
          <ClipboardList className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada data SPK pada filter ini
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Distribusi jumlah unit per tahapan otomatis tampil setelah SPK motor masuk atau status filter diubah ke Semua Status.
          </p>
          {onViewJobs && (
            <button
              type="button"
              onClick={onViewJobs}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Lihat Daftar SPK
            </button>
          )}
        </div>
      ) : (
        <div>
          <div data-testid="job-status-bar-chart" className="h-[275px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.data}
                margin={{ top: 12, right: 12, left: -12, bottom: isCompact ? 22 : 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{
                    fill: '#475569',
                    fontSize: isCompact ? 10 : 11,
                    fontWeight: 500,
                  }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  interval={0}
                  angle={isCompact ? -35 : 0}
                  textAnchor={isCompact ? 'end' : 'middle'}
                  height={isCompact ? 54 : 30}
                  dy={isCompact ? 2 : 6}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={(v) => `${v}`}
                  tick={{
                    fill: '#64748B',
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  content={<CustomStatusTooltip />}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah SPK"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {summary.data.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={entry.count === 0 ? '#E2E8F0' : entry.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#64748B] inline-block" />
                Pra-Kerja (Antrean &amp; Diagnosa)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706] inline-block" />
                Produksi (Gulung, Oven &amp; Mekanikal)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0284C7] inline-block" />
                Pengujian QC &amp; Megger
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669] inline-block" />
                Selesai &amp; Diserahkan
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Arahkan kursor ke batang untuk rincian SPK
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
