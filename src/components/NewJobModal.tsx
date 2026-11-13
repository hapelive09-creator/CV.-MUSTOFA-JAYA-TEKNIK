import React, { useState } from 'react';
import { JobOrder, Customer, Technician, JobPriority, JobStatus } from '../types';
import {
  X,
  Plus,
  Wrench,
  Zap,
  Building,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface NewJobModalProps {
  customers: Customer[];
  technicians: Technician[];
  onClose: () => void;
  onSubmit: (newJob: JobOrder) => void;
  nextSpkNumber: string;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  customers,
  technicians,
  onClose,
  onSubmit,
  nextSpkNumber,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [motorBrand, setMotorBrand] = useState('TECO Westinghouse');
  const [powerHp, setPowerHp] = useState<number>(20);
  const [powerKw, setPowerKw] = useState<number>(15);
  const [voltage, setVoltage] = useState('380 V');
  const [rpm, setRpm] = useState<number>(1450);
  const [poles, setPoles] = useState<number>(4);
  const [phase, setPhase] = useState<1 | 3>(3);
  const [connection, setConnection] = useState<'Y' | 'Δ' | 'Y/Δ'>('Δ');
  const [frameSize, setFrameSize] = useState('160L');
  const [serialNumber, setSerialNumber] = useState('SN-2024-' + Math.floor(1000 + Math.random() * 9000));
  const [customerUnitTag, setCustomerUnitTag] = useState('MTR-PUMP-01');
  const [priority, setPriority] = useState<JobPriority>('Biasa');

  // Diagnosis
  const [statorBurned, setStatorBurned] = useState(true);
  const [bearingDamaged, setBearingDamaged] = useState(true);
  const [shaftWorn, setShaftWorn] = useState(false);
  const [rotorFriction, setRotorFriction] = useState(false);
  const [initialMeggerMohm, setInitialMeggerMohm] = useState<number>(0.02);
  const [visualCheck, setVisualCheck] = useState('Stator terbakar hitam gosong, kumparan fasa short to ground.');
  const [assignedTech, setAssignedTech] = useState<string>(technicians[0]?.name || 'Pak Mustofa');

  const handleHpChange = (hp: number) => {
    setPowerHp(hp);
    setPowerKw(Number((hp * 0.7457).toFixed(1)));
  };

  const handlePolesChange = (p: number) => {
    setPoles(p);
    if (p === 2) setRpm(2950);
    else if (p === 4) setRpm(1450);
    else if (p === 6) setRpm(960);
    else if (p === 8) setRpm(720);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    // Estimate realistic copper wire kg based on HP
    const estCopperKg = Number(Math.max(2.5, powerHp * 0.55).toFixed(1));

    const newJob: JobOrder = {
      id: nextSpkNumber,
      orderDate: new Date().toISOString().split('T')[0],
      targetDate,
      customerId: customer.id,
      customerName: customer.name,
      customerCompany: customer.company,
      customerPhone: customer.phone,
      motorBrand,
      powerHp,
      powerKw,
      voltage,
      rpm,
      poles,
      phase,
      connection,
      frameSize,
      serialNumber,
      customerUnitTag,
      priority,
      status: 'antrean',
      initialDiagnosis: {
        visualCheck,
        statorBurned,
        bearingDamaged,
        shaftWorn,
        rotorFriction,
        initialMeggerMohm,
        notes: `Diterima di workshop CV. Mustofa Jaya Teknik pada ${new Date().toLocaleDateString('id-ID')}.`,
      },
      technicalSpecs: {
        slots: poles === 2 ? 36 : 48,
        coilsPerGroup: 3,
        windingType: 'Lap (Jerat)',
        pitchSpan: poles === 2 ? '1 - 14, 1 - 16' : '1 - 10, 1 - 12',
        wireDiameterMm: 0.95,
        swg: 20,
        parallelWires: 2,
        turnsPerSlot: 28,
        copperWeightKg: estCopperKg,
        insulationClass: 'Class F (155°C)',
        slotInsulationType: 'Nomex 410 (0.25mm)',
        connectionDiagram: '1 Delta (Δ)',
        leadWireSpec: 'Kabel Silikon 6 mm² 200°C',
        varnishType: 'Dr. Beck Baking Varnish Oven 135°C',
        bearingFrontType: 'SKF 6308-2RS1 / C3',
        bearingRearType: 'SKF 6208-2RS1 / C3',
      },
      costs: {
        copperWireKg: estCopperKg,
        copperPricePerKg: 195000,
        bearingFrontCost: bearingDamaged ? 285000 : 0,
        bearingRearCost: bearingDamaged ? 220000 : 0,
        insulationAndVarnishCost: 350000,
        machiningCost: shaftWorn ? 450000 : 0,
        laborCost: Math.round(powerHp * 85000 + 500000),
        transportCost: 150000,
        taxPercent: 11,
        notes: 'Garansi resmi 6 bulan pemakaian normal.',
      },
      paymentStatus: 'Belum Ditagih',
      assignedTechnicians: [assignedTech],
    };

    onSubmit(newJob);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col my-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Penerimaan Motor Listrik Baru (Surat Perintah Kerja - SPK)
              </h2>
              <p className="text-xs text-slate-500">
                Nomor Registrasi: <strong className="font-mono text-slate-900">{nextSpkNumber}</strong>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Section 1: Customer & Target Date */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-600" />
              1. Data Pelanggan & Jadwal Pengerjaan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Pilih Pelanggan / Pabrik:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Target Selesai / Siap Uji:
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Prioritas Pengerjaan:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as JobPriority)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Biasa">Biasa (Standar Workshop)</option>
                  <option value="Mendesak">Mendesak (Prioritas Jalur Cepat)</option>
                  <option value="Emergency 24 Jam">Emergency 24 Jam (Lembur Stop Line)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Motor Nameplate Data */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              2. Data Nameplate Unit Motor Masuk
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded border border-slate-200">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Merk Motor:</label>
                <input
                  type="text"
                  required
                  value={motorBrand}
                  onChange={(e) => setMotorBrand(e.target.value)}
                  placeholder="Siemens, TECO, ABB, WEG..."
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Daya (HP / kW):</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    value={powerHp}
                    onChange={(e) => handleHpChange(Number(e.target.value))}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold"
                    title="HP"
                  />
                  <input
                    type="number"
                    value={powerKw}
                    readOnly
                    className="p-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
                    title="kW"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Kutub & RPM:</label>
                <select
                  value={poles}
                  onChange={(e) => handlePolesChange(Number(e.target.value))}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                >
                  <option value={2}>2 Pole (3000 RPM sinc.)</option>
                  <option value={4}>4 Pole (1500 RPM sinc.)</option>
                  <option value={6}>6 Pole (1000 RPM sinc.)</option>
                  <option value={8}>8 Pole (750 RPM sinc.)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Tegangan (Volt):</label>
                <select
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                >
                  <option value="380 V">380 V (3 Phase)</option>
                  <option value="220/380 V">220/380 V</option>
                  <option value="380/660 V">380/660 V</option>
                  <option value="220 V">220 V (1 Phase)</option>
                  <option value="3.3 kV">3.3 kV (Medium Voltage)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Hubungan Gulungan:</label>
                <select
                  value={connection}
                  onChange={(e) => setConnection(e.target.value as any)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                >
                  <option value="Δ">Delta (Δ)</option>
                  <option value="Y">Star (Y)</option>
                  <option value="Y/Δ">Star / Delta (Y/Δ)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Frame Size:</label>
                <input
                  type="text"
                  value={frameSize}
                  onChange={(e) => setFrameSize(e.target.value)}
                  placeholder="Contoh: 160L"
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nomor Seri (Serial No):</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Tag Unit Pelanggan:</label>
                <input
                  type="text"
                  value={customerUnitTag}
                  onChange={(e) => setCustomerUnitTag(e.target.value)}
                  placeholder="Contoh: MTR-BLOWER-02"
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-amber-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Initial Diagnosis & Failure Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              3. Hasil Diagnosa Pembongkaran Awal
            </h3>
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statorBurned}
                    onChange={(e) => setStatorBurned(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-semibold text-red-700">Stator Gosong / Terbakar</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bearingDamaged}
                    onChange={(e) => setBearingDamaged(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Bearing Macet / Aus</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shaftWorn}
                    onChange={(e) => setShaftWorn(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Poros Aus (Perlu Bubut)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rotorFriction}
                    onChange={(e) => setRotorFriction(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Rotor Gesek Stator</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">
                    Uraian Kerusakan Fisik & Visual:
                  </label>
                  <input
                    type="text"
                    value={visualCheck}
                    onChange={(e) => setVisualCheck(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Megger Awal ke Body (MΩ):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialMeggerMohm}
                    onChange={(e) => setInitialMeggerMohm(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-red-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Penugasan Teknisi Utama:
                </label>
                <select
                  value={assignedTech}
                  onChange={(e) => setAssignedTech(e.target.value)}
                  className="w-full sm:w-1/2 p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs"
            >
              Terbitkan SPK & Masukkan ke Antrean
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
