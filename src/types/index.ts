export type JobPriority = 'Biasa' | 'Mendesak' | 'Emergency 24 Jam';

export type JobStatus =
  | 'antrean'
  | 'diagnosa'
  | 'penawaran'
  | 'insulasi'
  | 'gulung'
  | 'koneksi_lacing'
  | 'varnish_oven'
  | 'mekanikal_bearing'
  | 'qc_testing'
  | 'siap_kirim'
  | 'diserahkan';

export interface InitialDiagnosis {
  visualCheck: string;
  statorBurned: boolean;
  bearingDamaged: boolean;
  shaftWorn: boolean;
  rotorFriction: boolean;
  initialMeggerMohm: number;
  notes: string;
}

export interface TechnicalSpecs {
  slots: number;
  coilsPerGroup: number;
  windingType: 'Lap (Jerat)' | 'Concentric (Konsentris)' | 'Wave (Gelombang)';
  pitchSpan: string;
  wireDiameterMm: number;
  swg: number;
  parallelWires: number;
  turnsPerSlot: number;
  copperWeightKg: number;
  insulationClass: 'Class B (130°C)' | 'Class F (155°C)' | 'Class H (180°C)';
  slotInsulationType: 'Nomex 410 (0.25mm)' | 'DMD Film (0.30mm)' | 'Mylar / Poliester';
  connectionDiagram: '1 Star (Y)' | '2 Star (YY)' | '1 Delta (Δ)' | '2 Delta (ΔΔ)';
  leadWireSpec: string;
  varnishType: string;
  bearingFrontType: string;
  bearingRearType: string;
}

export interface TestReport {
  testDate: string;
  testerName: string;
  meggerVoltageV: number;
  meggerStatorBodyMohm: number;
  meggerPhasePhaseMohm: {
    rs: number;
    st: number;
    tr: number;
  };
  windingResistanceOhm: {
    uv: number;
    vw: number;
    wu: number;
  };
  noLoadTest: {
    appliedVoltageV: number;
    currentR_Amps: number;
    currentS_Amps: number;
    currentT_Amps: number;
    actualRpm: number;
    vibrationDE_mm_s: number;
    vibrationNDE_mm_s: number;
    tempDE_C: number;
    tempNDE_C: number;
  };
  overallResult: 'Lolos QC (Passed)' | 'Perlu Perbaikan (Failed)';
  qcNotes: string;
  warrantyMonths: number;
}

export interface JobCosts {
  copperWireKg: number;
  copperPricePerKg: number;
  bearingFrontCost: number;
  bearingRearCost: number;
  insulationAndVarnishCost: number;
  machiningCost: number;
  laborCost: number;
  transportCost: number;
  taxPercent: number;
  notes: string;
}

export type PaymentStatus = 'Belum Ditagih' | 'Menunggu Pembayaran' | 'DP Diterima' | 'Lunas';

export interface JobOrder {
  id: string; // e.g. SPK-2026-081
  orderDate: string;
  targetDate: string;
  completedDate?: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  motorBrand: string;
  powerHp: number;
  powerKw: number;
  voltage: string;
  rpm: number;
  poles: number;
  phase: 1 | 3;
  connection: 'Y' | 'Δ' | 'Y/Δ';
  frameSize: string;
  serialNumber: string;
  customerUnitTag: string;
  priority: JobPriority;
  status: JobStatus;
  initialDiagnosis: InitialDiagnosis;
  technicalSpecs: TechnicalSpecs;
  testReport?: TestReport;
  costs: JobCosts;
  paymentStatus: PaymentStatus;
  dpAmount?: number;
  assignedTechnicians: string[];
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  industryType: string;
  totalJobs: number;
}

export type InventoryCategory =
  | 'Kawat Email'
  | 'Bahan Isolasi'
  | 'Bearing'
  | 'Varnish & Kimia'
  | 'Kabel & Terminal'
  | 'Lainnya';

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: InventoryCategory;
  stock: number;
  unit: string;
  minStockAlert: number;
  unitPrice: number;
  location: string;
}

export interface Technician {
  id: string;
  name: string;
  role: 'Lead Rewinder' | 'Teknisi Gulung' | 'Teknisi Mekanikal & Bubut' | 'Quality Control & Tester';
  phone: string;
  activeJobsCount: number;
}

export interface WorkshopProfile {
  companyName: string;
  tagline: string;
  legalNumber: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  managerName: string;
  leadEngineerName: string;
}
