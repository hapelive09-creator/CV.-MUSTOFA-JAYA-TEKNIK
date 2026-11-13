import React, { useState } from 'react';
import {
  calculateWireArea,
  calculateWireWeight,
  calculateEquivalentWires,
  calculateMotorFullLoadAmps,
  calculateJobCost,
  formatRupiah,
  SWG_TABLE,
} from '../utils/rewindingCalculators';
import {
  X,
  Calculator,
  Layers,
  Zap,
  Banknote,
  Repeat,
  CheckCircle,
} from 'lucide-react';

interface RewindingCalculatorModalProps {
  onClose: () => void;
}

export const RewindingCalculatorModal: React.FC<RewindingCalculatorModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'wire' | 'weight' | 'motor' | 'cost'>('wire');

  // Tab 1: Wire Equivalence State
  const [origDiameter, setOrigDiameter] = useState<number>(1.2);
  const [targetStrands, setTargetStrands] = useState<number>(2);

  const equivDiameter = calculateEquivalentWires(origDiameter, targetStrands);
  const origArea = calculateWireArea(origDiameter);
  const equivArea = calculateWireArea(equivDiameter) * targetStrands;

  // Tab 2: Wire Weight & Turn State
  const [slotCount, setSlotCount] = useState<number>(36);
  const [turnsPerSlot, setTurnsPerSlot] = useState<number>(30);
  const [meanTurnLengthCm, setMeanTurnLengthCm] = useState<number>(45); // Average circumference of 1 turn
  const [calcWireDiam, setCalcWireDiam] = useState<number>(0.85);
  const [calcStrands, setCalcStrands] = useState<number>(2);

  // Total length = (slotCount / 2 * coils) * turns * meanLength
  const totalTurnsInMotor = (slotCount / 2) * turnsPerSlot;
  const totalLengthMeters = (totalTurnsInMotor * (meanTurnLengthCm / 100)) * calcStrands;
  const calculatedWeightKg = calculateWireWeight(totalLengthMeters, calcWireDiam);

  // Tab 3: Motor Electrical Spec
  const [motorHp, setMotorHp] = useState<number>(25);
  const [motorVoltage, setMotorVoltage] = useState<number>(380);
  const [motorPhases, setMotorPhases] = useState<number>(3);
  const [motorPoles, setMotorPoles] = useState<number>(4);

  const estimatedAmps = calculateMotorFullLoadAmps(motorHp, motorVoltage, motorPhases);
  const motorKw = Number((motorHp * 0.7457).toFixed(2));
  const syncRpm = Math.round((120 * 50) / motorPoles); // at 50 Hz

  // Tab 4: Cost Estimator
  const [costWireKg, setCostWireKg] = useState<number>(15);
  const [costWirePrice, setCostWirePrice] = useState<number>(195000);
  const [costBearing, setCostBearing] = useState<number>(550000);
  const [costInsulation, setCostInsulation] = useState<number>(350000);
  const [costLabor, setCostLabor] = useState<number>(1800000);
  const [costTaxPct, setCostTaxPct] = useState<number>(11);

  const jobCostSummary = calculateJobCost(
    costWireKg,
    costWirePrice,
    costBearing,
    costInsulation,
    costLabor,
    costTaxPct
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl flex flex-col my-4">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kalkulator Rekayasa Gulungan & Estimasi Bengkel
              </h2>
              <p className="text-xs text-slate-500">
                Alat bantu hitung kawat email, kesetaraan kawat paralel, dan estimasi biaya perbaikan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('wire')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'wire'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kesetaraan Kawat
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'weight'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estimasi Berat Kawat
          </button>
          <button
            onClick={() => setActiveTab('motor')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'motor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Arus Motor & Pole
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'cost'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kalkulator Biaya
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-xs text-slate-800 space-y-4">
          {/* TAB 1: WIRE EQUIVALENCE */}
          {activeTab === 'wire' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 p-3 rounded border border-amber-200 text-slate-700 leading-relaxed">
                <strong>Fungsi:</strong> Jika ukuran kawat kran tunggal yang dibutuhkan habis di rak bengkel, hitung diameter kawat ganda/paralel dengan luas penampang yang sama persis agar tahanan dan kapasitas arus tidak berubah.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Diameter Kawat Asli (Ø mm):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={origDiameter}
                    onChange={(e) => setOrigDiameter(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    Luas Penampang: <span className="font-mono">{origArea} mm²</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ganti Menjadi Berapa Kawat Paralel?
                  </label>
                  <select
                    value={targetStrands}
                    onChange={(e) => setTargetStrands(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                  >
                    <option value={2}>2 Kawat Rangkap (Paralel)</option>
                    <option value={3}>3 Kawat Rangkap (Paralel)</option>
                    <option value={4}>4 Kawat Rangkap (Paralel)</option>
                    <option value={5}>5 Kawat Rangkap (Paralel)</option>
                  </select>
                </div>
              </div>

              {/* Equivalence Result Card */}
              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Ukuran Kawat Pengganti yang Dibutuhkan:
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    {targetStrands} x Ø {equivDiameter} mm
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Total Luas Penampang: {equivArea.toFixed(4)} mm² (Sesuai 100%)
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Setara Sempurna
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WIRE WEIGHT ESTIMATOR */}
          {activeTab === 'weight' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jumlah Alur (Slots):
                  </label>
                  <input
                    type="number"
                    value={slotCount}
                    onChange={(e) => setSlotCount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Lilitan per Alur (Turns):
                  </label>
                  <input
                    type="number"
                    value={turnsPerSlot}
                    onChange={(e) => setTurnsPerSlot(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Keliling Rata-rata Coil (cm):
                  </label>
                  <input
                    type="number"
                    value={meanTurnLengthCm}
                    onChange={(e) => setMeanTurnLengthCm(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Diameter Kawat (Ø mm):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calcWireDiam}
                    onChange={(e) => setCalcWireDiam(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jumlah Kawat Paralel:
                  </label>
                  <input
                    type="number"
                    value={calcStrands}
                    onChange={(e) => setCalcStrands(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Estimasi Kebutuhan Kawat Email Tembaga:
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {calculatedWeightKg} kg
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Total Panjang Kawat: {totalLengthMeters.toFixed(0)} meter (Massa jenis Cu: 8.89 g/cm³)
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Estimasi Biaya Material:</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {formatRupiah(calculatedWeightKg * 195000)}
                  </div>
                  <div className="text-[10px] text-slate-500">@ Rp 195.000 / kg</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOTOR AMPS & POLES */}
          {activeTab === 'motor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Daya Motor (HP):
                  </label>
                  <input
                    type="number"
                    value={motorHp}
                    onChange={(e) => setMotorHp(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tegangan (Volt):
                  </label>
                  <select
                    value={motorVoltage}
                    onChange={(e) => setMotorVoltage(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value={220}>220 V (1 Phase / 3 Phase)</option>
                    <option value={380}>380 V (Standar Industri)</option>
                    <option value={660}>660 V (Tegangan Star)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Fasa (Phase):
                  </label>
                  <select
                    value={motorPhases}
                    onChange={(e) => setMotorPhases(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value={3}>3 Fasa (3-Phase)</option>
                    <option value={1}>1 Fasa (Single Phase)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jumlah Kutub (Poles):
                  </label>
                  <select
                    value={motorPoles}
                    onChange={(e) => setMotorPoles(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value={2}>2 Pole (3000 RPM sinc.)</option>
                    <option value={4}>4 Pole (1500 RPM sinc.)</option>
                    <option value={6}>6 Pole (1000 RPM sinc.)</option>
                    <option value={8}>8 Pole (750 RPM sinc.)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-lg grid grid-cols-3 gap-3 text-center">
                <div className="border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Daya Terkonversi</span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {motorKw} kW
                  </div>
                </div>

                <div className="border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Arus Penuh (FLA)</span>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {estimatedAmps} A
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Kecepatan Sinkron</span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {syncRpm} RPM (50Hz)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JOB COST ESTIMATOR */}
          {activeTab === 'cost' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Berat Tembaga (kg):
                  </label>
                  <input
                    type="number"
                    value={costWireKg}
                    onChange={(e) => setCostWireKg(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Harga Kawat / kg (Rp):
                  </label>
                  <input
                    type="number"
                    value={costWirePrice}
                    onChange={(e) => setCostWirePrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biaya Bearing (DE + NDE):
                  </label>
                  <input
                    type="number"
                    value={costBearing}
                    onChange={(e) => setCostBearing(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Insulasi & Vernis Oven:
                  </label>
                  <input
                    type="number"
                    value={costInsulation}
                    onChange={(e) => setCostInsulation(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jasa Rewinding & Teknisi:
                  </label>
                  <input
                    type="number"
                    value={costLabor}
                    onChange={(e) => setCostLabor(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    PPN (%):
                  </label>
                  <input
                    type="number"
                    value={costTaxPct}
                    onChange={(e) => setCostTaxPct(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Material Kawat Tembaga:</span>
                  <span>{formatRupiah(jobCostSummary.copperCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Sparepart & Bahan Kimia:</span>
                  <span>{formatRupiah(jobCostSummary.partsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Jasa Servis & Overhaul:</span>
                  <span>{formatRupiah(jobCostSummary.laborCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatRupiah(jobCostSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN ({costTaxPct}%):</span>
                  <span>{formatRupiah(jobCostSummary.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-1.5">
                  <span>Estimasi Total Penawaran:</span>
                  <span className="text-amber-700">{formatRupiah(jobCostSummary.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
