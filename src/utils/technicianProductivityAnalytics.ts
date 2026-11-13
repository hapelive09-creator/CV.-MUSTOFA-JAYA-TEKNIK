import { JobOrder, Technician } from '../types';
import { calculateJobTotalRevenue, isCompletedJobOrder } from './revenueAnalytics';

export type ProductivityMetricMode = 'count' | 'power_hp';

export interface TechnicianProductivityDatum {
  technicianId: string;
  name: string;
  role: string;
  color: string;
  completedCount: number;
  activeCount: number;
  totalPowerHp: number;
  totalRevenueHandled: number;
  shareByCountPct: number;
  shareByPowerPct: number;
  sampleCompletedSpkIds: string[];
}

export interface TechnicianProductivitySummary {
  data: TechnicianProductivityDatum[];
  activeSlices: TechnicianProductivityDatum[];
  totalCompletedJobs: number;
  totalCompletedAssignments: number;
  totalCompletedPowerHp: number;
  averageCompletedPerTech: number;
  activeTechniciansCount: number;
  topByCount: TechnicianProductivityDatum | null;
  topByPower: TechnicianProductivityDatum | null;
}

const TECHNICIAN_PALETTE = [
  '#D97706', // Amber 600 - Lead / Workshop signature
  '#059669', // Emerald 600 - Quality / Completion
  '#0284C7', // Sky 600 - Technical / Diagnostics
  '#475569', // Slate 600 - Mechanical / Industrial neutral
  '#EA580C', // Orange 600
  '#0D9488', // Teal 600
  '#7C3AED', // Violet 600
];

/**
 * Menghitung proporsi pekerjaan selesai (status siap_kirim / diserahkan)
 * per teknisi untuk visualisasi Pie Chart produktivitas tim.
 */
export function calculateTechnicianProductivity(
  jobs: JobOrder[],
  technicians: Technician[]
): TechnicianProductivitySummary {
  const map = new Map<string, TechnicianProductivityDatum>();

  technicians.forEach((tech, idx) => {
    map.set(tech.name, {
      technicianId: tech.id,
      name: tech.name,
      role: tech.role,
      color: TECHNICIAN_PALETTE[idx % TECHNICIAN_PALETTE.length],
      completedCount: 0,
      activeCount: 0,
      totalPowerHp: 0,
      totalRevenueHandled: 0,
      shareByCountPct: 0,
      shareByPowerPct: 0,
      sampleCompletedSpkIds: [],
    });
  });

  let totalCompletedJobs = 0;

  for (const job of jobs) {
    const completed = isCompletedJobOrder(job);
    if (completed) {
      totalCompletedJobs += 1;
    }

    const assigned = Array.isArray(job.assignedTechnicians)
      ? Array.from(new Set(job.assignedTechnicians.map((t) => t.trim()).filter(Boolean)))
      : [];

    if (assigned.length === 0) continue;

    const jobRevenue = calculateJobTotalRevenue(job).grandTotal;

    for (const techName of assigned) {
      let entry = map.get(techName);
      if (!entry) {
        const nextIdx = map.size;
        entry = {
          technicianId: `TECH-EXT-${nextIdx + 1}`,
          name: techName,
          role: 'Teknisi Bengkel',
          color: TECHNICIAN_PALETTE[nextIdx % TECHNICIAN_PALETTE.length],
          completedCount: 0,
          activeCount: 0,
          totalPowerHp: 0,
          totalRevenueHandled: 0,
          shareByCountPct: 0,
          shareByPowerPct: 0,
          sampleCompletedSpkIds: [],
        };
        map.set(techName, entry);
      }

      if (completed) {
        entry.completedCount += 1;
        entry.totalPowerHp += Number(job.powerHp) || 0;
        entry.totalRevenueHandled += jobRevenue;
        if (entry.sampleCompletedSpkIds.length < 3) {
          entry.sampleCompletedSpkIds.push(job.id);
        }
      } else {
        entry.activeCount += 1;
      }
    }
  }

  const allEntries = Array.from(map.values());
  const totalCompletedAssignments = allEntries.reduce(
    (sum, item) => sum + item.completedCount,
    0
  );
  const totalCompletedPowerHp = allEntries.reduce(
    (sum, item) => sum + item.totalPowerHp,
    0
  );

  for (const item of allEntries) {
    item.shareByCountPct =
      totalCompletedAssignments > 0
        ? Math.round((item.completedCount / totalCompletedAssignments) * 1000) / 10
        : 0;
    item.shareByPowerPct =
      totalCompletedPowerHp > 0
        ? Math.round((item.totalPowerHp / totalCompletedPowerHp) * 1000) / 10
        : 0;
  }

  // Urutkan berdasarkan kontribusi selesai terbanyak, lalu kapasitas HP
  const data = allEntries.sort((a, b) => {
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    return b.totalPowerHp - a.totalPowerHp;
  });

  const activeSlices = data.filter((item) => item.completedCount > 0);
  const activeTechniciansCount = data.length;
  const averageCompletedPerTech =
    activeTechniciansCount > 0
      ? Math.round((totalCompletedAssignments / activeTechniciansCount) * 10) / 10
      : 0;

  const topByCount = activeSlices.length > 0 ? activeSlices[0] : null;
  const topByPower =
    activeSlices.length > 0
      ? [...activeSlices].sort((a, b) => b.totalPowerHp - a.totalPowerHp)[0]
      : null;

  return {
    data,
    activeSlices,
    totalCompletedJobs,
    totalCompletedAssignments,
    totalCompletedPowerHp,
    averageCompletedPerTech,
    activeTechniciansCount,
    topByCount,
    topByPower,
  };
}
