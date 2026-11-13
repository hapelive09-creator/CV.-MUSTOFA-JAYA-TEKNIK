import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieChartIcon, ArrowRight, Users } from 'lucide-react';
import { JobOrder, Technician } from '../types';
import {
  calculateTechnicianProductivity,
  ProductivityMetricMode,
  TechnicianProductivityDatum,
} from '../utils/technicianProductivityAnalytics';
import { formatRupiah } from '../utils/rewindingCalculators';

interface TechnicianProductivityChartProps {
  jobs: JobOrder[];
  technicians: Technician[];
  onViewJobs?: () => void;
  onViewTeam?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TechnicianProductivityDatum }>;
  metricMode: ProductivityMetricMode;
}

const CustomProductivityTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  metricMode,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  const primaryPct =
    metricMode === 'count' ? datum.shareByCountPct : datum.shareByPowerPct;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-3 rounded-lg shadow-lg border border-slate-700/80 text-xs min-w-[235px]">
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-700/80">
        <div>
          <div className="font-bold text-slate-100">{datum.name}</div>
          <div className="text-[10px] text-slate-400">{datum.role}</div>
        </div>
        <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
          {primaryPct}%
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-4 text-emerald-300">
          <span>Pekerjaan Selesai</span>
          <span className="font-mono font-bold tabular-nums">
            {datum.completedCount} Unit
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sky-300">
          <span>Total Kapasitas Selesai</span>
          <span className="font-mono font-semibold tabular-nums">
            {datum.totalPowerHp} HP
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Nilai Pekerjaan Ditangani</span>
          <span className="font-mono tabular-nums">
            {formatRupiah(datum.totalRevenueHandled)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-amber-300">
          <span>Sedang Aktif Digarap</span>
          <span className="font-mono tabular-nums">{datum.activeCount} Unit</span>
        </div>
        {datum.sampleCompletedSpkIds.length > 0 && (
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            SPK: {datum.sampleCompletedSpkIds.join(', ')}
            {datum.completedCount > datum.sampleCompletedSpkIds.length ? '…' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export const TechnicianProductivityChart: React.FC<TechnicianProductivityChartProps> = ({
  jobs,
  technicians,
  onViewJobs,
  onViewTeam,
}) => {
  const [metricMode, setMetricMode] = useState<ProductivityMetricMode>('count');

  const summary = useMemo(
    () => calculateTechnicianProductivity(jobs, technicians),
    [jobs, technicians]
  );

  const dataKey = metricMode === 'count' ? 'completedCount' : 'totalPowerHp';
  const highlightedTop =
    metricMode === 'count' ? summary.topByCount : summary.topByPower;

  return (
    <section
      aria-labelledby="technician-productivity-heading"
      className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      {/* Header Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <h3
              id="technician-productivity-heading"
              className="text-sm font-bold text-slate-900 tracking-tight"
            >
              Proporsi Pekerjaan Selesai per Teknisi (Produktivitas Tim)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribusi kontribusi SPK berstatus Siap Kirim &amp; Telah Diserahkan oleh masing-masing teknisi bengkel
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start xl:self-auto shrink-0">
          <div
            role="group"
            aria-label="Basis proporsi produktivitas teknisi"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0"
          >
            <button
              type="button"
              aria-pressed={metricMode === 'count'}
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                metricMode === 'count'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jumlah Unit
            </button>
            <button
              type="button"
              aria-pressed={metricMode === 'power_hp'}
              onClick={() => setMetricMode('power_hp')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                metricMode === 'power_hp'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kapasitas (HP)
            </button>
          </div>

          {onViewTeam && (
            <button
              type="button"
              onClick={onViewTeam}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 group whitespace-nowrap shrink-0"
            >
              Tim Teknisi
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-slate-50/80 border border-slate-200/70 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total SPK Selesai &amp; Kontribusi
          </div>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span
              data-testid="tech-chart-total-completed"
              className="text-lg font-extrabold text-slate-900 font-mono tabular-nums"
            >
              {summary.totalCompletedJobs} SPK
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              · {summary.totalCompletedAssignments} penugasan teknisi
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Kontributor Tertinggi ({metricMode === 'count' ? 'Unit' : 'Daya'})
          </div>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span
              data-testid="tech-chart-top-performer"
              className="text-sm font-bold text-emerald-700 truncate"
            >
              {highlightedTop ? highlightedTop.name : 'Belum ada data'}
            </span>
            {highlightedTop && (
              <span className="text-xs text-slate-600 font-mono tabular-nums">
                ·{' '}
                {metricMode === 'count'
                  ? `${highlightedTop.completedCount} unit (${highlightedTop.shareByCountPct}%)`
                  : `${highlightedTop.totalPowerHp} HP (${highlightedTop.shareByPowerPct}%)`}
              </span>
            )}
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-200/80 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata Output / Teknisi
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              data-testid="tech-chart-avg-output"
              className="text-lg font-extrabold text-amber-700 font-mono tabular-nums"
            >
              {summary.averageCompletedPerTech} Unit
            </span>
            <span className="text-xs text-slate-500">
              · {summary.activeTechniciansCount} personel tim
            </span>
          </div>
        </div>
      </div>

      {/* Pie Chart + Structured Breakdown Grid or Empty State */}
      {summary.activeSlices.length === 0 ? (
        <div
          data-testid="tech-productivity-empty"
          className="h-[250px] flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
        >
          <Users className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Belum ada pekerjaan selesai yang tercatat pada teknisi
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Proporsi produktivitas tim otomatis muncul ketika SPK yang ditangani teknisi mencapai status Selesai &amp; Siap Kirim atau Telah Diserahkan.
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut / Pie Chart */}
            <div
              data-testid="tech-productivity-pie-chart"
              className="lg:col-span-5 relative h-[260px] w-full flex items-center justify-center"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.activeSlices}
                    dataKey={dataKey}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={102}
                    paddingAngle={3}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {summary.activeSlices.map((entry) => (
                      <Cell key={entry.technicianId} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomProductivityTooltip metricMode={metricMode} />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric Readout */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {metricMode === 'count' ? 'Penugasan' : 'Total Daya'}
                </span>
                <span
                  data-testid="tech-chart-center-total"
                  className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight mt-0.5"
                >
                  {metricMode === 'count'
                    ? summary.totalCompletedAssignments
                    : summary.totalCompletedPowerHp}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {metricMode === 'count' ? 'Unit Selesai' : 'HP Selesai'}
                </span>
              </div>
            </div>

            {/* Structured Technician Share Breakdown */}
            <div className="lg:col-span-7 divide-y divide-slate-100 border-t lg:border-t-0 border-slate-100">
              {summary.data.map((tech) => {
                const sharePct =
                  metricMode === 'count' ? tech.shareByCountPct : tech.shareByPowerPct;
                const primaryMetric =
                  metricMode === 'count'
                    ? `${tech.completedCount} Unit`
                    : `${tech.totalPowerHp} HP`;

                return (
                  <div
                    key={tech.technicianId}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: tech.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {tech.name}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                            {tech.role}
                          </span>
                        </div>
                        <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(sharePct, tech.completedCount > 0 ? 4 : 0))}%`,
                              backgroundColor: tech.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-xs font-extrabold text-slate-900 font-mono tabular-nums">
                          {primaryMetric}
                        </span>
                        <span className="text-xs font-bold text-slate-600 font-mono tabular-nums w-12 text-right">
                          {sharePct}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                        {metricMode === 'count'
                          ? `${tech.totalPowerHp} HP selesai`
                          : `${tech.completedCount} unit selesai`}
                        {' · '}
                        {tech.activeCount} aktif
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Catatan: Satu SPK motor dapat dikerjakan secara kolaboratif oleh teknisi gulung, mekanikal, dan penguji QC.
            </span>
            <span className="font-mono text-slate-400">
              Arahkan kursor ke segmen pie untuk rincian SPK
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
