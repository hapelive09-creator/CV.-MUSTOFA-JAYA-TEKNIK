import { JobOrder, JobStatus } from '../types';

export type WorkflowPhase = 'Pra-Kerja' | 'Produksi' | 'Pengujian' | 'Selesai';

export interface JobStatusMeta {
  status: JobStatus;
  shortLabel: string;
  label: string;
  phase: WorkflowPhase;
  color: string;
}

export const JOB_STATUS_ORDER: JobStatusMeta[] = [
  {
    status: 'antrean',
    shortLabel: 'Antrean',
    label: 'Penerimaan / Antrean',
    phase: 'Pra-Kerja',
    color: '#64748B', // Slate 500
  },
  {
    status: 'diagnosa',
    shortLabel: 'Diagnosa',
    label: 'Bongkar & Diagnosa',
    phase: 'Pra-Kerja',
    color: '#475569', // Slate 600
  },
  {
    status: 'penawaran',
    shortLabel: 'Penawaran',
    label: 'Penawaran Biaya',
    phase: 'Pra-Kerja',
    color: '#94A3B8', // Slate 400
  },
  {
    status: 'insulasi',
    shortLabel: 'Insulasi',
    label: 'Insulasi Slot',
    phase: 'Produksi',
    color: '#F59E0B', // Amber 500
  },
  {
    status: 'gulung',
    shortLabel: 'Gulung',
    label: 'Proses Gulung',
    phase: 'Produksi',
    color: '#D97706', // Amber 600
  },
  {
    status: 'koneksi_lacing',
    shortLabel: 'Koneksi',
    label: 'Koneksi & Lacing',
    phase: 'Produksi',
    color: '#B45309', // Amber 700
  },
  {
    status: 'varnish_oven',
    shortLabel: 'Oven',
    label: 'Varnish & Oven',
    phase: 'Produksi',
    color: '#EA580C', // Orange 600
  },
  {
    status: 'mekanikal_bearing',
    shortLabel: 'Mekanikal',
    label: 'Mekanikal & Bearing',
    phase: 'Produksi',
    color: '#C2410C', // Orange 700
  },
  {
    status: 'qc_testing',
    shortLabel: 'Uji QC',
    label: 'Uji QC & Megger',
    phase: 'Pengujian',
    color: '#0284C7', // Sky 600
  },
  {
    status: 'siap_kirim',
    shortLabel: 'Siap Kirim',
    label: 'Selesai & Siap Kirim',
    phase: 'Selesai',
    color: '#10B981', // Emerald 500
  },
  {
    status: 'diserahkan',
    shortLabel: 'Diserahkan',
    label: 'Telah Diserahkan',
    phase: 'Selesai',
    color: '#059669', // Emerald 600
  },
];

export interface JobStatusDatum extends JobStatusMeta {
  count: number;
  urgentCount: number;
  totalPowerHp: number;
  sharePct: number;
  sampleIds: string[];
}

export interface JobStatusAnalyticsSummary {
  data: JobStatusDatum[];
  totalJobs: number;
  activeJobsCount: number;
  completedJobsCount: number;
  urgentActiveCount: number;
  activeStageCount: number;
  bottleneckStage: JobStatusDatum | null;
}

export type JobStatusFilterMode = 'all' | 'in_progress' | 'non_empty';

export function isTerminalStatus(status: JobStatus): boolean {
  return status === 'siap_kirim' || status === 'diserahkan';
}

export function isUrgentPriority(priority: JobOrder['priority']): boolean {
  return priority === 'Emergency 24 Jam' || priority === 'Mendesak';
}

/**
 * Mengagregasi daftar SPK berdasarkan status pekerjaan secara kronologis sesuai alur workshop.
 */
export function calculateJobStatusDistribution(
  jobs: JobOrder[],
  options: { filterMode?: JobStatusFilterMode } = {}
): JobStatusAnalyticsSummary {
  const filterMode: JobStatusFilterMode = options.filterMode ?? 'all';
  const totalJobs = jobs.length;

  const grouped = new Map<
    JobStatus,
    { count: number; urgentCount: number; totalPowerHp: number; sampleIds: string[] }
  >();

  for (const meta of JOB_STATUS_ORDER) {
    grouped.set(meta.status, {
      count: 0,
      urgentCount: 0,
      totalPowerHp: 0,
      sampleIds: [],
    });
  }

  let activeJobsCount = 0;
  let completedJobsCount = 0;
  let urgentActiveCount = 0;

  for (const job of jobs) {
    const bucket = grouped.get(job.status);
    const terminal = isTerminalStatus(job.status);
    const urgent = isUrgentPriority(job.priority);

    if (terminal) {
      completedJobsCount += 1;
    } else {
      activeJobsCount += 1;
      if (urgent) urgentActiveCount += 1;
    }

    if (bucket) {
      bucket.count += 1;
      if (urgent) bucket.urgentCount += 1;
      bucket.totalPowerHp += Math.max(0, Number(job.powerHp) || 0);
      if (bucket.sampleIds.length < 3) {
        bucket.sampleIds.push(job.id);
      }
    }
  }

  const allDatums: JobStatusDatum[] = JOB_STATUS_ORDER.map((meta) => {
    const bucket = grouped.get(meta.status)!;
    const sharePct = totalJobs > 0 ? Math.round((bucket.count / totalJobs) * 100) : 0;
    return {
      ...meta,
      count: bucket.count,
      urgentCount: bucket.urgentCount,
      totalPowerHp: Math.round(bucket.totalPowerHp * 10) / 10,
      sharePct,
      sampleIds: bucket.sampleIds,
    };
  });

  // Tahap workshop aktif (belum diserahkan/siap kirim) dengan beban terbanyak
  let bottleneckStage: JobStatusDatum | null = null;
  for (const datum of allDatums) {
    if (!isTerminalStatus(datum.status) && datum.count > 0) {
      if (!bottleneckStage || datum.count > bottleneckStage.count) {
        bottleneckStage = datum;
      }
    }
  }

  const activeStageCount = allDatums.filter(
    (d) => !isTerminalStatus(d.status) && d.count > 0
  ).length;

  let filteredData = allDatums;
  if (filterMode === 'in_progress') {
    filteredData = allDatums.filter((d) => !isTerminalStatus(d.status));
  } else if (filterMode === 'non_empty') {
    filteredData = allDatums.filter((d) => d.count > 0);
  }

  return {
    data: filteredData,
    totalJobs,
    activeJobsCount,
    completedJobsCount,
    urgentActiveCount,
    activeStageCount,
    bottleneckStage,
  };
}
