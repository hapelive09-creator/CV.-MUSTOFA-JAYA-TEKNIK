import React, { useMemo, useState } from 'react';
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
import { BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { JobOrder } from '../types';
import {
  calculateMonthlyCompletedRevenue,
  formatCompactRupiah,
  MonthlyRevenueDatum,
} from '../utils/revenueAnalytics';
import { formatRupiah } from '../utils/rewindingCalculators';

interface MonthlyRevenueChartProps {
  jobs: JobOrder[];
  onViewJobs?: () => void;
  onViewInvoices?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthlyRevenueDatum }>;
}

const CustomRevenueTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[220px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <span className="font-bold text-slate-100">{datum.monthLabel}</span>
        <span className="font-mono text-[11px] text-amber-300 font-semibold tabular-nums">
          {datum.completedCount} Unit Selesai
        </span>
      </div>

      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">
          Total Pendapatan (Incl. PPN)
        </div>
        <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
          {formatRupiah(datum.revenue)}
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Jasa Rewinding</span>
          <span className="font-mono tabular-nums">{formatRupiah(datum.laborCost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Material &amp; Kawat</span>
          <span className="font-mono tabular-nums">{formatRupiah(datum.materialCost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>PPN</span>
          <span className="font-mono tabular-nums">{formatRupiah(datum.taxAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  jobs,
  onViewJobs,
  onViewInvoices,
}) => {
  const [periodMode, setPeriodMode] = useState<'6m' | 'all'>('6m');

  const summary = useMemo(
    () =>
      calculateMonthlyCompletedRevenue(jobs, {
        monthsLimit: periodMode === '6m' ? 6 : undefined,
      }),
    [jobs, periodMode]
  );

  return (
    <section
      aria-labelledby="monthly-revenue-heading"
      className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600 shrink-0" />
            <h3
              id="monthly-revenue-heading"
              className="text-sm font-bold text-slate-900 tracking-tight"
            >
              Pendapatan Bulanan Unit Selesai
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realisasi tagihan SPK berstatus Siap Kirim &amp; Telah Diserahkan (termasuk PPN)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            role="group"
            aria-label="Rentang waktu grafik pendapatan"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
          >
            <button
              type="button"
              aria-pressed={periodMode === '6m'}
              onClick={() => setPeriodMode('6m')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                periodMode === '6m'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Bulan
            </button>
            <button
              type="button"
              aria-pressed={periodMode === 'all'}
              onClick={() => setPeriodMode('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                periodMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Bulan
            </button>
          </div>

          {onViewInvoices && (
            <button
              type="button"
              onClick={onViewInvoices}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group whitespace-nowrap shrink-0 ml-1"
            >
              Daftar Faktur
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-slate-50/80 border border-slate-200/70 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Pendapatan ({periodMode === '6m' ? '6 Bulan' : 'Keseluruhan'})
          </div>
          <div
            data-testid="revenue-chart-total"
            className="text-lg font-extrabold text-slate-900 font-mono tabular-nums mt-0.5"
          >
            {formatRupiah(summary.totalRevenue)}
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata / Bulan Aktif
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatRupiah(summary.averageMonthlyRevenue)}
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Unit Selesai &amp; Puncak Bulan
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="revenue-chart-completed-count"
              className="text-lg font-extrabold text-emerald-700 font-mono tabular-nums"
            >
              {summary.totalCompletedJobs} Unit
            </span>
            {summary.peakMonth && (
              <span className="text-xs text-slate-600 truncate">
                · Puncak{' '}
                <span className="font-semibold text-slate-800">
                  {summary.peakMonth.monthLabel}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart Area or Empty State */}
      {summary.totalCompletedJobs === 0 ? (
        <div
          data-testid="monthly-revenue-empty"
          className="h-[260px] flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
        >
          <CheckCircle2 className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada unit selesai pada periode ini
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Pendapatan bulanan otomatis tercatat saat SPK motor mencapai tahap Selesai &amp; Siap Kirim atau Telah Diserahkan.
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
          <div
            data-testid="monthly-revenue-chart"
            className="h-[270px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.monthlyData}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tickFormatter={formatCompactRupiah}
                  tick={{
                    fill: '#64748B',
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={84}
                />
                <Tooltip
                  content={<CustomRevenueTooltip />}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar
                  dataKey="revenue"
                  name="Pendapatan Selesai"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                >
                  {summary.monthlyData.map((entry) => {
                    const isPeak =
                      summary.peakMonth?.monthKey === entry.monthKey &&
                      entry.revenue > 0;
                    const fillColor =
                      entry.revenue === 0
                        ? '#E2E8F0'
                        : isPeak
                        ? '#B45309'
                        : '#D97706';
                    return (
                      <Cell
                        key={entry.monthKey}
                        fill={fillColor}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706] inline-block" />
                Pendapatan Bulanan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B45309] inline-block" />
                Bulan Tertinggi ({summary.peakMonth?.monthLabel ?? '-'})
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Basis tanggal: Selesai QC / Penyerahan
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
