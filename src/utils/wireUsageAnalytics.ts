import { InventoryItem, JobOrder } from '../types';

const INDONESIAN_MONTHS_SHORT = [
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

export interface WireUsageMonthDatum {
  monthKey: string;
  monthLabel: string;
  totalUsedKg: number;
  realizedKg: number;
  inProgressKg: number;
  estimatedWireValue: number;
  jobCount: number;
  wireSpecsSummary: string[];
}

export interface WireGaugeComparisonDatum {
  skuCode: string;
  label: string;
  diameterMm: number | null;
  usedKg: number;
  currentStockKg: number;
  minStockAlertKg: number;
}

export interface WireUsageSummary {
  monthlyData: WireUsageMonthDatum[];
  gaugeComparison: WireGaugeComparisonDatum[];
  totalUsedKg: number;
  totalJobsCount: number;
  averageMonthlyKg: number;
  peakMonth: WireUsageMonthDatum | null;
  totalCopperStockKg: number;
  copperSkuCount: number;
  lowCopperSkuCount: number;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function extractMonthKey(dateStr?: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}`;
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const shortMonth = INDONESIAN_MONTHS_SHORT[monthIdx] || monthStr;
  return `${shortMonth} ${yearStr}`;
}

function enumerateMonthRange(startKey: string, endKey: string): string[] {
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);

  const keys: string[] = [];
  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return keys;
}

function extractDiameterMmFromText(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  if (!match) return null;
  const num = Number(match[1].replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function getJobWireWeightKg(job: JobOrder): number {
  const specsWeight = Number(job.technicalSpecs?.copperWeightKg);
  if (Number.isFinite(specsWeight) && specsWeight > 0) return specsWeight;
  const costWeight = Number(job.costs?.copperWireKg);
  if (Number.isFinite(costWeight) && costWeight > 0) return costWeight;
  return 0;
}

export function calculateWireUsageTrend(
  jobs: JobOrder[],
  inventory: InventoryItem[],
  options?: { monthsLimit?: number }
): WireUsageSummary {
  const copperItems = inventory.filter((item) => item.category === 'Kawat Email');
  const totalCopperStockKg = roundTo2(
    copperItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0)
  );
  const lowCopperSkuCount = copperItems.filter(
    (item) => item.stock <= item.minStockAlert
  ).length;

  // Build monthly buckets from historical jobs
  interface MonthBucket {
    realizedKg: number;
    inProgressKg: number;
    estimatedWireValue: number;
    jobCount: number;
    diameters: Set<string>;
  }

  const buckets = new Map<string, MonthBucket>();

  for (const job of jobs) {
    const weightKg = getJobWireWeightKg(job);
    if (weightKg <= 0) continue;

    const monthKey =
      extractMonthKey(job.completedDate) || extractMonthKey(job.orderDate);
    if (!monthKey) continue;

    const existing = buckets.get(monthKey) || {
      realizedKg: 0,
      inProgressKg: 0,
      estimatedWireValue: 0,
      jobCount: 0,
      diameters: new Set<string>(),
    };

    const isRealized =
      job.status === 'siap_kirim' || job.status === 'diserahkan';
    if (isRealized) {
      existing.realizedKg += weightKg;
    } else {
      existing.inProgressKg += weightKg;
    }

    const pricePerKg = Number(job.costs?.copperPricePerKg) || 195000;
    existing.estimatedWireValue += weightKg * pricePerKg;
    existing.jobCount += 1;

    const diam = Number(job.technicalSpecs?.wireDiameterMm);
    if (Number.isFinite(diam) && diam > 0) {
      existing.diameters.add(`Ø ${diam.toFixed(2)} mm`);
    }

    buckets.set(monthKey, existing);
  }

  const sortedKeys = Array.from(buckets.keys()).sort();
  let monthlyData: WireUsageMonthDatum[] = [];

  if (sortedKeys.length > 0) {
    const continuousKeys = enumerateMonthRange(
      sortedKeys[0],
      sortedKeys[sortedKeys.length - 1]
    );
    const limitedKeys =
      options?.monthsLimit && options.monthsLimit > 0
        ? continuousKeys.slice(-options.monthsLimit)
        : continuousKeys;

    monthlyData = limitedKeys.map((monthKey) => {
      const b = buckets.get(monthKey);
      if (!b) {
        return {
          monthKey,
          monthLabel: formatMonthLabel(monthKey),
          totalUsedKg: 0,
          realizedKg: 0,
          inProgressKg: 0,
          estimatedWireValue: 0,
          jobCount: 0,
          wireSpecsSummary: [],
        };
      }
      const realizedKg = roundTo2(b.realizedKg);
      const inProgressKg = roundTo2(b.inProgressKg);
      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        totalUsedKg: roundTo2(realizedKg + inProgressKg),
        realizedKg,
        inProgressKg,
        estimatedWireValue: Math.round(b.estimatedWireValue),
        jobCount: b.jobCount,
        wireSpecsSummary: Array.from(b.diameters).sort(),
      };
    });
  }

  const totalUsedKg = roundTo2(
    monthlyData.reduce((sum, d) => sum + d.totalUsedKg, 0)
  );
  const totalJobsCount = monthlyData.reduce((sum, d) => sum + d.jobCount, 0);
  const activeMonths = monthlyData.filter((d) => d.totalUsedKg > 0);
  const averageMonthlyKg =
    activeMonths.length > 0 ? roundTo2(totalUsedKg / activeMonths.length) : 0;

  let peakMonth: WireUsageMonthDatum | null = null;
  for (const d of monthlyData) {
    if (d.totalUsedKg > 0 && (!peakMonth || d.totalUsedKg > peakMonth.totalUsedKg)) {
      peakMonth = d;
    }
  }

  // Per-diameter / SKU comparison against current stock
  const skuEntries = copperItems.map((item) => {
    const diam = extractDiameterMmFromText(item.name);
    return {
      skuCode: item.code,
      label: diam ? `Ø ${diam.toFixed(2)} mm (${item.code})` : item.code,
      diameterMm: diam,
      usedKg: 0,
      currentStockKg: roundTo2(Number(item.stock) || 0),
      minStockAlertKg: roundTo2(Number(item.minStockAlert) || 0),
    } satisfies WireGaugeComparisonDatum;
  });

  if (skuEntries.length > 0) {
    for (const job of jobs) {
      const weightKg = getJobWireWeightKg(job);
      if (weightKg <= 0) continue;

      const jobDiam = Number(job.technicalSpecs?.wireDiameterMm);
      if (!Number.isFinite(jobDiam) || jobDiam <= 0) continue;

      let closestEntry: WireGaugeComparisonDatum | null = null;
      let minDiff = Infinity;

      for (const entry of skuEntries) {
        if (entry.diameterMm === null) continue;
        const diff = Math.abs(entry.diameterMm - jobDiam);
        if (diff < minDiff) {
          minDiff = diff;
          closestEntry = entry;
        }
      }

      if (closestEntry) {
        closestEntry.usedKg = roundTo2(closestEntry.usedKg + weightKg);
      }
    }
  }

  return {
    monthlyData,
    gaugeComparison: skuEntries,
    totalUsedKg,
    totalJobsCount,
    averageMonthlyKg,
    peakMonth,
    totalCopperStockKg,
    copperSkuCount: copperItems.length,
    lowCopperSkuCount,
  };
}
