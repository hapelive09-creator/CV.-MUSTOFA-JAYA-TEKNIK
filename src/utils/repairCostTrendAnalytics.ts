import { JobOrder } from '../types';
import {
  calculateJobTotalRevenue,
  extractMonthKey,
  formatMonthKeyLabel,
  isCompletedJobOrder,
} from './revenueAnalytics';

export interface RepairCostTrendDatum {
  monthKey: string; // e.g. '2026-11'
  monthLabel: string; // e.g. 'Nov 2026'
  shortLabel: string; // e.g. 'Nov'
  totalRepairCost: number; // Total biaya perbaikan (incl. PPN) semua SPK masuk
  realizedCost: number; // Bagian SPK berstatus siap_kirim / diserahkan
  inProgressCost: number; // Bagian SPK masih dalam pengerjaan
  materialCost: number; // Total biaya kawat email, bearing, isolasi, bubut, transport
  laborCost: number; // Total biaya jasa rewinding
  taxAmount: number; // Total PPN
  spkCount: number;
  completedCount: number;
  inProgressCount: number;
}

export interface RepairCostTrendSummary {
  monthlyData: RepairCostTrendDatum[];
  totalRepairCost: number;
  totalRealizedCost: number;
  totalInProgressCost: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalSpkCount: number;
  averageMonthlyCost: number;
  peakMonth: RepairCostTrendDatum | null;
  latestMonth: RepairCostTrendDatum | null;
  previousMonth: RepairCostTrendDatum | null;
  momDeltaPct: number | null;
}

function stepMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + deltaMonths, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function enumerateMonthRange(startKey: string, endKey: string): string[] {
  const result: string[] = [];
  let cursor = startKey;
  let guard = 0;
  while (cursor <= endKey && guard < 120) {
    result.push(cursor);
    cursor = stepMonthKey(cursor, 1);
    guard += 1;
  }
  return result;
}

/**
 * Menghitung tren bulanan total biaya perbaikan SPK (termasuk pemisahan
 * realisasi selesai vs dalam pengerjaan, serta komponen jasa vs material)
 * untuk grafik garis Dashboard CV. Mustofa Jaya Teknik.
 */
export function calculateMonthlyRepairCostTrend(
  jobs: JobOrder[],
  options: { monthsLimit?: number } = {}
): RepairCostTrendSummary {
  if (!jobs || jobs.length === 0) {
    return {
      monthlyData: [],
      totalRepairCost: 0,
      totalRealizedCost: 0,
      totalInProgressCost: 0,
      totalMaterialCost: 0,
      totalLaborCost: 0,
      totalSpkCount: 0,
      averageMonthlyCost: 0,
      peakMonth: null,
      latestMonth: null,
      previousMonth: null,
      momDeltaPct: null,
    };
  }

  const buckets = new Map<string, RepairCostTrendDatum>();

  for (const job of jobs) {
    const monthKey =
      extractMonthKey(job.orderDate) ||
      extractMonthKey(job.completedDate) ||
      extractMonthKey(job.targetDate);

    if (!monthKey) continue;

    const breakdown = calculateJobTotalRevenue(job);
    const completed = isCompletedJobOrder(job);

    let bucket = buckets.get(monthKey);
    if (!bucket) {
      const { monthLabel, shortLabel } = formatMonthKeyLabel(monthKey);
      bucket = {
        monthKey,
        monthLabel,
        shortLabel,
        totalRepairCost: 0,
        realizedCost: 0,
        inProgressCost: 0,
        materialCost: 0,
        laborCost: 0,
        taxAmount: 0,
        spkCount: 0,
        completedCount: 0,
        inProgressCount: 0,
      };
      buckets.set(monthKey, bucket);
    }

    bucket.totalRepairCost += breakdown.grandTotal;
    bucket.materialCost += breakdown.materialCost;
    bucket.laborCost += breakdown.laborCost;
    bucket.taxAmount += breakdown.taxAmount;
    bucket.spkCount += 1;

    if (completed) {
      bucket.realizedCost += breakdown.grandTotal;
      bucket.completedCount += 1;
    } else {
      bucket.inProgressCost += breakdown.grandTotal;
      bucket.inProgressCount += 1;
    }
  }

  const sortedKeys = Array.from(buckets.keys()).sort();
  if (sortedKeys.length === 0) {
    return {
      monthlyData: [],
      totalRepairCost: 0,
      totalRealizedCost: 0,
      totalInProgressCost: 0,
      totalMaterialCost: 0,
      totalLaborCost: 0,
      totalSpkCount: 0,
      averageMonthlyCost: 0,
      peakMonth: null,
      latestMonth: null,
      previousMonth: null,
      momDeltaPct: null,
    };
  }

  const latestKey = sortedKeys[sortedKeys.length - 1];
  const earliestKey = sortedKeys[0];
  const windowMonths = options.monthsLimit ?? 6;
  const minStartForWindow = stepMonthKey(latestKey, -(windowMonths - 1));

  const startKey =
    options.monthsLimit !== undefined
      ? minStartForWindow
      : earliestKey < minStartForWindow
      ? earliestKey
      : minStartForWindow;

  const timelineKeys = enumerateMonthRange(startKey, latestKey);

  const monthlyData: RepairCostTrendDatum[] = timelineKeys.map((key) => {
    const existing = buckets.get(key);
    if (existing) return existing;
    const { monthLabel, shortLabel } = formatMonthKeyLabel(key);
    return {
      monthKey: key,
      monthLabel,
      shortLabel,
      totalRepairCost: 0,
      realizedCost: 0,
      inProgressCost: 0,
      materialCost: 0,
      laborCost: 0,
      taxAmount: 0,
      spkCount: 0,
      completedCount: 0,
      inProgressCount: 0,
    };
  });

  const totalRepairCost = monthlyData.reduce((sum, d) => sum + d.totalRepairCost, 0);
  const totalRealizedCost = monthlyData.reduce((sum, d) => sum + d.realizedCost, 0);
  const totalInProgressCost = monthlyData.reduce((sum, d) => sum + d.inProgressCost, 0);
  const totalMaterialCost = monthlyData.reduce((sum, d) => sum + d.materialCost, 0);
  const totalLaborCost = monthlyData.reduce((sum, d) => sum + d.laborCost, 0);
  const totalSpkCount = monthlyData.reduce((sum, d) => sum + d.spkCount, 0);

  const activeMonths = monthlyData.filter((d) => d.totalRepairCost > 0);
  const averageMonthlyCost =
    activeMonths.length > 0 ? Math.round(totalRepairCost / activeMonths.length) : 0;

  let peakMonth: RepairCostTrendDatum | null = null;
  for (const item of monthlyData) {
    if (item.totalRepairCost > 0 && (!peakMonth || item.totalRepairCost > peakMonth.totalRepairCost)) {
      peakMonth = item;
    }
  }

  const latestMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  let momDeltaPct: number | null = null;
  if (latestMonth && previousMonth && previousMonth.totalRepairCost > 0) {
    momDeltaPct = Math.round(
      ((latestMonth.totalRepairCost - previousMonth.totalRepairCost) /
        previousMonth.totalRepairCost) *
        100
    );
  }

  return {
    monthlyData,
    totalRepairCost,
    totalRealizedCost,
    totalInProgressCost,
    totalMaterialCost,
    totalLaborCost,
    totalSpkCount,
    averageMonthlyCost,
    peakMonth,
    latestMonth,
    previousMonth,
    momDeltaPct,
  };
}
