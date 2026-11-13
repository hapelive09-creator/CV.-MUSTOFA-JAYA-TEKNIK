import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, PackageCheck } from 'lucide-react';
import { InventoryItem, JobOrder } from '../types';
import {
  calculateWireUsageTrend,
  WireGaugeComparisonDatum,
  WireUsageMonthDatum,
} from '../utils/wireUsageAnalytics';
import { formatRupiah } from '../utils/rewindingCalculators';

interface WireUsageTrendChartProps {
  jobs: JobOrder[];
  inventory: InventoryItem[];
}

interface MonthlyTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WireUsageMonthDatum }>;
}

const MonthlyWireTooltip: React.FC<MonthlyTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[235px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <span className="font-bold text-slate-100">{datum.monthLabel}</span>
        <span className="font-mono text-[11px] text-amber-300 font-semibold tabular-nums">
          {datum.jobCount} SPK Gulung
        </span>
      </div>

      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">
          Total Penggunaan Kawat Email
        </div>
        <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
          {datum.totalUsedKg.toFixed(1)} kg
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-emerald-300">
          <span>Unit Selesai (Realisasi)</span>
          <span className="font-mono tabular-nums">{datum.realizedKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-amber-300">
          <span>SPK Dalam Pengerjaan</span>
          <span className="font-mono tabular-nums">{datum.inProgressKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Estimasi Nilai Tembaga</span>
          <span className="font-mono tabular-nums">{formatRupiah(datum.estimatedWireValue)}</span>
        </div>
        {datum.wireSpecsSummary.length > 0 && (
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
            Diameter: {datum.wireSpecsSummary.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

interface GaugeTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WireGaugeComparisonDatum }>;
}

const GaugeWireTooltip: React.FC<GaugeTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  const isLow = datum.currentStockKg <= datum.minStockAlertKg;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[220px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <span className="font-bold text-slate-100">{datum.label}</span>
        {isLow && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40">
            Stok Menipis
          </span>
        )}
      </div>
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-amber-300">
          <span>Pemakaian Historis</span>
          <span className="font-mono font-bold tabular-nums">{datum.usedKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-emerald-300">
          <span>Stok Gudang Saat Ini</span>
          <span className="font-mono font-bold tabular-nums">{datum.currentStockKg.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Batas Minimum Alert</span>
          <span className="font-mono tabular-nums">{datum.minStockAlertKg.toFixed(1)} kg</span>
        </div>
      </div>
    </div>
  );
};

export const WireUsageTrendChart: React.FC<WireUsageTrendChartProps> = ({
  jobs,
  inventory,
}) => {
  const [chartView, setChartView] = useState<'trend' | 'gauge'>('trend');
  const [periodMode, setPeriodMode] = useState<'6m' | 'all'>('6m');

  const summary = useMemo(
    () =>
      calculateWireUsageTrend(jobs, inventory, {
        monthsLimit: periodMode === '6m' ? 6 : undefined,
      }),
    [jobs, inventory, periodMode]
  );

  return (
    <section
      aria-labelledby="wire-usage-trend-heading"
      className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            <h3
              id="wire-usage-trend-heading"
              className="text-sm font-bold text-slate-900 tracking-tight"
            >
              Tren Penggunaan Stok Kawat Email (Historis)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis konsumsi tembaga email (kg) dari riwayat SPK penggulungan dan perbandingan stok gudang saat ini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Chart Mode Switcher */}
          <div
            role="group"
            aria-label="Mode tampilan grafik kawat email"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
          >
            <button
              type="button"
              aria-pressed={chartView === 'trend'}
              onClick={() => setChartView('trend')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                chartView === 'trend'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Bulanan
            </button>
            <button
              type="button"
              aria-pressed={chartView === 'gauge'}
              onClick={() => setChartView('gauge')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                chartView === 'gauge'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Diameter Kawat
            </button>
          </div>

          {/* Period Switcher (for Monthly Trend) */}
          {chartView === 'trend' && (
            <div
              role="group"
              aria-label="Rentang waktu tren kawat email"
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
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-slate-50/80 border border-slate-200/70 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Pemakaian Historis ({periodMode === '6m' ? '6 Bulan' : 'Semua'})
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="wire-usage-total-kg"
              className="text-lg font-extrabold text-slate-900 font-mono tabular-nums"
            >
              {summary.totalUsedKg.toFixed(1)} kg
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({summary.totalJobsCount} SPK)
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata / Bulan Aktif
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-extrabold text-amber-700 font-mono tabular-nums">
              {summary.averageMonthlyKg.toFixed(1)} kg
            </span>
            {summary.peakMonth && (
              <span className="text-xs text-slate-600 truncate">
                · Puncak{' '}
                <strong className="text-slate-800">{summary.peakMonth.monthLabel}</strong> (
                {summary.peakMonth.totalUsedKg.toFixed(1)} kg)
              </span>
            )}
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sisa Stok Kawat Email Gudang
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="wire-current-stock-kg"
              className="text-lg font-extrabold text-emerald-700 font-mono tabular-nums"
            >
              {summary.totalCopperStockKg.toFixed(1)} kg
            </span>
            <span className="text-xs text-slate-600">
              · {summary.copperSkuCount} SKU
              {summary.lowCopperSkuCount > 0 && (
                <span className="text-rose-600 font-semibold ml-1">
                  ({summary.lowCopperSkuCount} menipis)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {summary.monthlyData.length === 0 ? (
        <div
          data-testid="wire-usage-empty"
          className="h-[240px] flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
        >
          <PackageCheck className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada data historis penggunaan kawat email
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Tren konsumsi tembaga akan tampil otomatis setelah ada SPK rewinding dengan spesifikasi berat kawat.
          </p>
        </div>
      ) : chartView === 'trend' ? (
        <div>
          <div data-testid="wire-usage-trend-chart" className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary.monthlyData}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="wireTotalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="wireRealizedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tickFormatter={(v) => `${v} kg`}
                  tick={{
                    fill: '#64748B',
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<MonthlyWireTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalUsedKg"
                  name="Total Penggunaan (kg)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fill="url(#wireTotalGradient)"
                  activeDot={{ r: 5, fill: '#B45309', stroke: '#FFFFFF', strokeWidth: 2 }}
                  dot={{ r: 3.5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="realizedKg"
                  name="Unit Selesai (kg)"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  fill="url(#wireRealizedGradient)"
                  dot={{ r: 3, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#D97706] inline-block" />
                Total Pemakaian Kawat (kg)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#059669] border-t border-dashed border-[#059669] inline-block" />
                Realisasi Unit Selesai (kg)
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Sumber: Data Teknis &amp; Biaya SPK Bengkel
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div data-testid="wire-usage-gauge-chart" className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.gaugeComparison}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tickFormatter={(v) => `${v} kg`}
                  tick={{
                    fill: '#64748B',
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<GaugeWireTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar
                  dataKey="usedKg"
                  name="Pemakaian Historis (kg)"
                  fill="#D97706"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
                <Bar
                  dataKey="currentStockKg"
                  name="Stok Gudang Saat Ini (kg)"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706] inline-block" />
                Pemakaian Historis (kg)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669] inline-block" />
                Stok Gudang Saat Ini (kg)
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Pemetaan diameter kawat terdekat terhadap SKU gudang
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
