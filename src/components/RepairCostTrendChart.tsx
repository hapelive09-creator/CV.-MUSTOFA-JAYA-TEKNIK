import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { JobOrder } from '../types';
import {
  calculateMonthlyRepairCostTrend,
  RepairCostTrendDatum,
} from '../utils/repairCostTrendAnalytics';
import { formatCompactRupiah } from '../utils/revenueAnalytics';
import { formatRupiah } from '../utils/rewindingCalculators';

interface RepairCostTrendChartProps {
  jobs: JobOrder[];
  onViewJobs?: () => void;
  onViewInvoices?: () => void;
}

type TrendSeriesMode = 'overview' | 'breakdown';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RepairCostTrendDatum }>;
}

const CustomRepairCostTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[245px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <span className="font-bold text-slate-100">{datum.monthLabel}</span>
        <span className="font-mono text-[11px] text-amber-300 font-semibold tabular-nums">
          {datum.spkCount} SPK Masuk
        </span>
      </div>

      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">
          Total Biaya Perbaikan SPK (Incl. PPN)
        </div>
        <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
          {formatRupiah(datum.totalRepairCost)}
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-emerald-300">
          <span>Realisasi Selesai ({datum.completedCount} SPK)</span>
          <span className="font-mono tabular-nums font-semibold">
            {formatRupiah(datum.realizedCost)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-amber-300">
          <span>Dalam Pengerjaan ({datum.inProgressCount} SPK)</span>
          <span className="font-mono tabular-nums">
            {formatRupiah(datum.inProgressCost)}
          </span>
        </div>
      </div>

      <div className="space-y-1 pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>Jasa Rewinding</span>
          <span className="font-mono tabular-nums">{formatRupiah(datum.laborCost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Material, Kawat &amp; Bearing</span>
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

export const RepairCostTrendChart: React.FC<RepairCostTrendChartProps> = ({
  jobs,
  onViewJobs,
  onViewInvoices,
}) => {
  const [seriesMode, setSeriesMode] = useState<TrendSeriesMode>('overview');
  const [periodMode, setPeriodMode] = useState<'6m' | 'all'>('6m');
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
    () =>
      calculateMonthlyRepairCostTrend(jobs, {
        monthsLimit: periodMode === '6m' ? 6 : undefined,
      }),
    [jobs, periodMode]
  );

  const momLabel =
    summary.momDeltaPct === null
      ? 'Basis awal'
      : summary.momDeltaPct > 0
      ? `+${summary.momDeltaPct}% vs bln lalu`
      : `${summary.momDeltaPct}% vs bln lalu`;

  return (
    <section
      aria-labelledby="repair-cost-trend-heading"
      className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      {/* Header Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            <h3
              id="repair-cost-trend-heading"
              className="text-sm font-bold text-slate-900 tracking-tight"
            >
              Tren Total Biaya Perbaikan Bulanan (Data SPK)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grafik garis nilai seluruh SPK masuk berdasarkan tanggal order untuk memantau pertumbuhan omzet bengkel
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start xl:self-auto shrink-0">
          <div
            role="group"
            aria-label="Mode seri grafik tren biaya perbaikan"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0"
          >
            <button
              type="button"
              aria-pressed={seriesMode === 'overview'}
              onClick={() => setSeriesMode('overview')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                seriesMode === 'overview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total &amp; Realisasi
            </button>
            <button
              type="button"
              aria-pressed={seriesMode === 'breakdown'}
              onClick={() => setSeriesMode('breakdown')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                seriesMode === 'breakdown'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jasa &amp; Material
            </button>
          </div>

          <div
            role="group"
            aria-label="Rentang waktu tren biaya perbaikan"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0"
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
              Semua
            </button>
          </div>

          {onViewInvoices && (
            <button
              type="button"
              onClick={onViewInvoices}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group whitespace-nowrap shrink-0"
            >
              Faktur
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-slate-50/80 border border-slate-200/70 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Biaya Perbaikan ({periodMode === '6m' ? '6 Bulan' : 'Semua'})
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="repair-trend-total-cost"
              className="text-lg font-extrabold text-slate-900 font-mono tabular-nums"
            >
              {formatRupiah(summary.totalRepairCost)}
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              · {summary.totalSpkCount} SPK
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Realisasi Selesai vs Dalam Proses
          </div>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span
              data-testid="repair-trend-realized-cost"
              className="text-lg font-extrabold text-emerald-700 font-mono tabular-nums"
            >
              {formatRupiah(summary.totalRealizedCost)}
            </span>
            <span className="text-xs text-amber-700 font-mono tabular-nums">
              · {formatCompactRupiah(summary.totalInProgressCost)} aktif
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata / Bulan Aktif
          </div>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span
              data-testid="repair-trend-avg-cost"
              className="text-lg font-extrabold text-slate-900 font-mono tabular-nums"
            >
              {formatRupiah(summary.averageMonthlyCost)}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                summary.momDeltaPct !== null && summary.momDeltaPct >= 0
                  ? 'text-emerald-700'
                  : summary.momDeltaPct !== null
                  ? 'text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              · {momLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Line Chart Area or Empty State */}
      {summary.monthlyData.length === 0 ? (
        <div
          data-testid="repair-cost-trend-empty"
          className="h-[250px] flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
        >
          <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada data biaya perbaikan SPK
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Grafik garis tren biaya perbaikan bulanan akan otomatis terbentuk setelah ada SPK motor masuk dengan rincian biaya jasa dan material.
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
          <div data-testid="repair-cost-line-chart" className="h-[275px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={summary.monthlyData}
                margin={{ top: 14, right: 16, left: 4, bottom: isCompact ? 16 : 6 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="monthLabel"
                  tick={{
                    fill: '#475569',
                    fontSize: isCompact ? 10 : 11,
                    fontWeight: 500,
                  }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  angle={isCompact ? -25 : 0}
                  textAnchor={isCompact ? 'end' : 'middle'}
                  height={isCompact ? 46 : 30}
                  dy={isCompact ? 2 : 6}
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
                <Tooltip content={<CustomRepairCostTooltip />} />
                {seriesMode === 'overview' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="totalRepairCost"
                      name="Total Biaya Perbaikan SPK"
                      stroke="#D97706"
                      strokeWidth={2.75}
                      dot={{ r: 4, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#B45309', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="realizedCost"
                      name="Realisasi Unit Selesai"
                      stroke="#059669"
                      strokeWidth={2.25}
                      strokeDasharray="5 4"
                      dot={{ r: 3.5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 5.5, fill: '#047857', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="materialCost"
                      name="Material, Kawat & Bearing"
                      stroke="#D97706"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#B45309', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="laborCost"
                      name="Jasa Rewinding"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#0369A1', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              {seriesMode === 'overview' ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-[#D97706] inline-block" />
                    Total Nilai Biaya Perbaikan (Semua SPK)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#059669] inline-block" />
                    Realisasi Selesai (Siap Kirim &amp; Diserahkan)
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-[#D97706] inline-block" />
                    Material, Kawat Email &amp; Bearing
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-[#0284C7] inline-block" />
                    Biaya Jasa Rewinding
                  </span>
                </>
              )}
            </div>
            <span className="font-mono text-slate-400">
              Basis tanggal: Tanggal Order SPK · Puncak{' '}
              {summary.peakMonth ? summary.peakMonth.monthLabel : '-'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
