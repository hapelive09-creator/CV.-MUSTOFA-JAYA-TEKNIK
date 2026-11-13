import { JobOrder } from '../types';

export interface MonthlyRevenueDatum {
  monthKey: string; // e.g. '2026-11'
  monthLabel: string; // e.g. 'Nov 2026'
  shortLabel: string; // e.g. 'Nov'
  revenue: number; // Grand total including tax
  subtotal: number; // Before tax
  materialCost: number;
  laborCost: number;
  taxAmount: number;
  completedCount: number;
}

export interface RevenueAnalyticsSummary {
  monthlyData: MonthlyRevenueDatum[];
  totalRevenue: number;
  totalCompletedJobs: number;
  averageMonthlyRevenue: number;
  peakMonth: MonthlyRevenueDatum | null;
}

const INDONESIAN_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function isCompletedJobOrder(job: JobOrder): boolean {
  return job.status === 'siap_kirim' || job.status === 'diserahkan';
}

export function calculateJobTotalRevenue(job: JobOrder): {
  materialCost: number;
  laborCost: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
} {
  const c = job.costs;
  const copperCost = Math.max(0, c.copperWireKg) * Math.max(0, c.copperPricePerKg);
  const materialCost = Math.round(
    copperCost +
      Math.max(0, c.bearingFrontCost) +
      Math.max(0, c.bearingRearCost) +
      Math.max(0, c.insulationAndVarnishCost) +
      Math.max(0, c.machiningCost) +
      Math.max(0, c.transportCost)
  );
  const laborCost = Math.round(Math.max(0, c.laborCost));
  const subtotal = materialCost + laborCost;
  const taxAmount = Math.round((subtotal * Math.max(0, c.taxPercent)) / 100);
  const grandTotal = subtotal + taxAmount;

  return {
    materialCost,
    laborCost,
    subtotal,
    taxAmount,
    grandTotal,
  };
}

export function extractMonthKey(dateStr?: string): string | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})/.exec(dateStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000) return null;
  return `${match[1]}-${match[2]}`;
}

export function formatMonthKeyLabel(monthKey: string): {
  monthLabel: string;
  shortLabel: string;
} {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const monthName = INDONESIAN_SHORT_MONTHS[monthIdx] || monthStr;
  return {
    monthLabel: `${monthName} ${yearStr}`,
    shortLabel: monthName,
  };
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

export function formatCompactRupiah(amount: number): string {
  if (amount === 0) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${sign}Rp ${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${sign}Rp ${val} jt`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `${sign}Rp ${val} rb`;
  }
  return `${sign}Rp ${abs}`;
}

/**
 * Aggregates monthly revenue from completed job orders ('siap_kirim' or 'diserahkan').
 * Fills contiguous months so the bar chart renders an unbroken chronological axis.
 */
export function calculateMonthlyCompletedRevenue(
  jobs: JobOrder[],
  options: { monthsLimit?: number } = {}
): RevenueAnalyticsSummary {
  const completedJobs = jobs.filter(isCompletedJobOrder);

  if (completedJobs.length === 0) {
    return {
      monthlyData: [],
      totalRevenue: 0,
      totalCompletedJobs: 0,
      averageMonthlyRevenue: 0,
      peakMonth: null,
    };
  }

  const buckets = new Map<string, MonthlyRevenueDatum>();
  let totalRevenue = 0;

  for (const job of completedJobs) {
    const monthKey =
      extractMonthKey(job.completedDate) ||
      extractMonthKey(job.targetDate) ||
      extractMonthKey(job.orderDate);

    if (!monthKey) continue;

    const breakdown = calculateJobTotalRevenue(job);
    totalRevenue += breakdown.grandTotal;

    const existing = buckets.get(monthKey);
    if (existing) {
      existing.revenue += breakdown.grandTotal;
      existing.subtotal += breakdown.subtotal;
      existing.materialCost += breakdown.materialCost;
      existing.laborCost += breakdown.laborCost;
      existing.taxAmount += breakdown.taxAmount;
      existing.completedCount += 1;
    } else {
      const { monthLabel, shortLabel } = formatMonthKeyLabel(monthKey);
      buckets.set(monthKey, {
        monthKey,
        monthLabel,
        shortLabel,
        revenue: breakdown.grandTotal,
        subtotal: breakdown.subtotal,
        materialCost: breakdown.materialCost,
        laborCost: breakdown.laborCost,
        taxAmount: breakdown.taxAmount,
        completedCount: 1,
      });
    }
  }

  const sortedKeys = Array.from(buckets.keys()).sort();
  if (sortedKeys.length === 0) {
    return {
      monthlyData: [],
      totalRevenue: 0,
      totalCompletedJobs: 0,
      averageMonthlyRevenue: 0,
      peakMonth: null,
    };
  }

  const latestKey = sortedKeys[sortedKeys.length - 1];
  const earliestKey = sortedKeys[0];
  const windowMonths = options.monthsLimit ?? 6;
  const minStartForWindow = stepMonthKey(latestKey, -(windowMonths - 1));

  // If monthsLimit is specified (e.g. 6), clamp start to the last N months;
  // otherwise span from earliest completed month (at least 6 months for balanced chart framing).
  const startKey =
    options.monthsLimit !== undefined
      ? minStartForWindow
      : earliestKey < minStartForWindow
      ? earliestKey
      : minStartForWindow;

  const timelineKeys = enumerateMonthRange(startKey, latestKey);

  const monthlyData: MonthlyRevenueDatum[] = timelineKeys.map((key) => {
    const existing = buckets.get(key);
    if (existing) return existing;
    const { monthLabel, shortLabel } = formatMonthKeyLabel(key);
    return {
      monthKey: key,
      monthLabel,
      shortLabel,
      revenue: 0,
      subtotal: 0,
      materialCost: 0,
      laborCost: 0,
      taxAmount: 0,
      completedCount: 0,
    };
  });

  const activeTotalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const activeCompletedJobs = monthlyData.reduce((sum, item) => sum + item.completedCount, 0);
  const monthsWithRevenue = monthlyData.filter((d) => d.revenue > 0);
  const averageMonthlyRevenue =
    monthsWithRevenue.length > 0
      ? Math.round(activeTotalRevenue / monthsWithRevenue.length)
      : 0;

  let peakMonth: MonthlyRevenueDatum | null = null;
  for (const item of monthlyData) {
    if (item.revenue > 0 && (!peakMonth || item.revenue > peakMonth.revenue)) {
      peakMonth = item;
    }
  }

  return {
    monthlyData,
    totalRevenue: activeTotalRevenue,
    totalCompletedJobs: activeCompletedJobs,
    averageMonthlyRevenue,
    peakMonth,
  };
}
