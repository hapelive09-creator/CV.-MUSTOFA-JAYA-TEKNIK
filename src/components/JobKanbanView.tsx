import React from 'react';
import { JobOrder, JobStatus } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  Wrench,
  Zap,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

interface JobKanbanViewProps {
  jobs: JobOrder[];
  onSelectJob: (job: JobOrder) => void;
  onUpdateJobStatus: (jobId: string, newStatus: JobStatus) => void;
  onOpenSpecs: (job: JobOrder) => void;
  onOpenQC: (job: JobOrder) => void;
}

interface ColumnDef {
  id: JobStatus;
  step: string;
  title: string;
  accent: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'antrean', step: '01', title: 'Antrean Masuk', accent: 'border-t-slate-400' },
  { id: 'diagnosa', step: '02', title: 'Bongkar & Diagnosa', accent: 'border-t-slate-500' },
  { id: 'insulasi', step: '03', title: 'Insulasi Slot', accent: 'border-t-indigo-500' },
  { id: 'gulung', step: '04', title: 'Proses Gulung', accent: 'border-t-amber-500' },
  { id: 'varnish_oven', step: '05', title: 'Varnish & Oven', accent: 'border-t-orange-500' },
  { id: 'mekanikal_bearing', step: '06', title: 'Bearing & As', accent: 'border-t-slate-600' },
  { id: 'qc_testing', step: '07', title: 'Uji QC Megger', accent: 'border-t-purple-500' },
  { id: 'siap_kirim', step: '08', title: 'Selesai Siap Kirim', accent: 'border-t-emerald-500' },
];

export const JobKanbanView: React.FC<JobKanbanViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJobStatus,
  onOpenSpecs,
  onOpenQC,
}) => {
  const getNextStatus = (current: JobStatus): JobStatus | null => {
    const sequence: JobStatus[] = [
      'antrean',
      'diagnosa',
      'insulasi',
      'gulung',
      'varnish_oven',
      'mekanikal_bearing',
      'qc_testing',
      'siap_kirim',
      'diserahkan',
    ];
    const idx = sequence.indexOf(current);
    if (idx >= 0 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (current: JobStatus): JobStatus | null => {
    const sequence: JobStatus[] = [
      'antrean',
      'diagnosa',
      'insulasi',
      'gulung',
      'varnish_oven',
      'mekanikal_bearing',
      'qc_testing',
      'siap_kirim',
      'diserahkan',
    ];
    const idx = sequence.indexOf(current);
    if (idx > 0) {
      return sequence[idx - 1];
    }
    return null;
  };

  const getPriorityBorder = (priority: string) => {
    if (priority === 'Emergency 24 Jam') return 'border-l-3 border-l-rose-500';
    if (priority === 'Mendesak') return 'border-l-3 border-l-amber-500';
    return 'border-l-3 border-l-slate-300';
  };

  return (
    <div className="space-y-4">
      {/* Description header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Papan Alur Kerja Workshop Rewinding
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geser posisi motor listrik secara berurutan dari pembongkaran awal, isolasi slot, penggulungan tembaga, oven baking, hingga pengujian sertifikat kelayakan QC.
          </p>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-slate-600 self-end md:self-auto">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Emergency 24h
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Mendesak
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Normal
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 items-start min-h-[640px]">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.id);

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 bg-slate-100/80 rounded-xl border border-slate-200/90 flex flex-col max-h-[780px] shadow-2xs border-t-3 ${col.accent}`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{col.step}</span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {col.title}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {colJobs.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colJobs.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada unit di tahapan ini
                  </div>
                ) : (
                  colJobs.map((job) => {
                    const next = getNextStatus(job.status);
                    const prev = getPrevStatus(job.status);

                    return (
                      <div
                        key={job.id}
                        className={`bg-white p-3 rounded-lg shadow-2xs border border-slate-200/80 hover:border-slate-300 transition-all ${getPriorityBorder(
                          job.priority
                        )}`}
                      >
                        {/* Top SPK & Unit Tag */}
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span
                            onClick={() => onSelectJob(job)}
                            className="font-mono font-bold text-slate-900 hover:text-amber-700 cursor-pointer"
                          >
                            {job.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {job.customerUnitTag}
                          </span>
                        </div>

                        {/* Customer Company */}
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {job.customerCompany}
                        </div>

                        {/* Motor Specs */}
                        <div className="text-[11px] text-slate-600 mt-1">
                          <strong>{job.motorBrand}</strong> · {job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM
                        </div>

                        {/* Technical Quick Highlights */}
                        <div className="text-[10px] text-slate-600 mt-1.5 bg-slate-50/80 p-1.5 rounded-md border border-slate-100 flex items-center justify-between font-mono">
                          <span>Ø {job.technicalSpecs.wireDiameterMm} mm</span>
                          <span>{job.technicalSpecs.copperWeightKg} kg Tembaga</span>
                        </div>

                        {/* Diagnosis Note */}
                        {job.initialDiagnosis.statorBurned && (
                          <div className="text-[10px] text-rose-600 mt-1 line-clamp-1 font-medium">
                            • {job.initialDiagnosis.visualCheck}
                          </div>
                        )}

                        {/* Card Footer: Technicians & Next/Prev Controls */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 truncate max-w-[100px] text-[10px]" title={job.assignedTechnicians.join(', ')}>
                            {job.assignedTechnicians[0]}
                          </span>

                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={() => onUpdateJobStatus(job.id, prev)}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                title="Kembalikan ke tahapan sebelumnya"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenSpecs(job)}
                              className="px-2 py-0.5 text-[10px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200/80 transition-colors"
                              title="Buka Data Teknis Gulungan"
                            >
                              Teknis
                            </button>

                            {next && (
                              <button
                                onClick={() => onUpdateJobStatus(job.id, next)}
                                className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition-colors"
                                title="Lanjut ke tahapan berikutnya"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
