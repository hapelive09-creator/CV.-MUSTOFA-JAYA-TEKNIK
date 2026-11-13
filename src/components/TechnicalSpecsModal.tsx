import React, { useEffect, useRef, useState } from 'react';
import { JobOrder, TechnicalSpecs } from '../types';
import { AppsScriptResponse } from '../services/appsScriptService';
import { calculateWireArea, SWG_TABLE } from '../utils/rewindingCalculators';
import { generateTechnicalSpecsHtml, printHtmlDocument } from '../utils/printDocuments';
import {
  X,
  Printer,
  Save,
  FileSpreadsheet,
  Zap,
  Layers,
  Wrench,
} from 'lucide-react';

interface TechnicalSpecsModalProps {
  job: JobOrder;
  onClose: () => void;
  onSave: (updatedJob: JobOrder, closeAfterSave?: boolean) => Promise<AppsScriptResponse> | void;
}

export const TechnicalSpecsModal: React.FC<TechnicalSpecsModalProps> = ({
  job,
  onClose,
  onSave,
}) => {
  const [specs, setSpecs] = useState<TechnicalSpecs>({ ...job.technicalSpecs });
  const [isSaved, setIsSaved] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const hasEditedRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const latestJobRef = useRef(job);
  const latestOnSaveRef = useRef(onSave);
  latestJobRef.current = job;
  latestOnSaveRef.current = onSave;

  const updateSpecs = (updater: TechnicalSpecs | ((prev: TechnicalSpecs) => TechnicalSpecs)) => {
    hasEditedRef.current = true;
    setSpecs(updater);
  };

  useEffect(() => {
    if (!hasEditedRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    setAutoSaveLabel('Menyimpan otomatis...');
    debounceTimerRef.current = window.setTimeout(async () => {
      hasEditedRef.current = false;
      const updatedJob: JobOrder = {
        ...latestJobRef.current,
        technicalSpecs: specs,
      };
      const res = await latestOnSaveRef.current(updatedJob, false);
      setAutoSaveLabel(
        res && res.status === 'error'
          ? 'Gagal auto-save ke Sheets'
          : 'Otomatis tersimpan ke database'
      );
      window.setTimeout(() => setAutoSaveLabel(null), 3000);
    }, 900);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [specs]);

  const wireArea = calculateWireArea(specs.wireDiameterMm) * (specs.parallelWires || 1);

  const handleWireDiameterChange = (diam: number) => {
    // Find closest SWG
    let closestSwg = 20;
    let minDiff = 999;
    Object.entries(SWG_TABLE).forEach(([swgStr, d]) => {
      const diff = Math.abs(d - diam);
      if (diff < minDiff) {
        minDiff = diff;
        closestSwg = Number(swgStr);
      }
    });

    updateSpecs({
      ...specs,
      wireDiameterMm: diam,
      swg: closestSwg,
    });
  };

  const handleSave = async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    hasEditedRef.current = false;
    setAutoSaveLabel(null);
    await onSave(
      {
        ...job,
        technicalSpecs: specs,
      },
      true
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePrint = async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    hasEditedRef.current = false;
    const updatedJob: JobOrder = {
      ...job,
      technicalSpecs: specs,
    };
    const res = await onSave(updatedJob, false);
    setAutoSaveLabel(
      res && res.status === 'error'
        ? 'Gagal auto-save ke Sheets'
        : 'Tersimpan ke database'
    );
    window.setTimeout(() => setAutoSaveLabel(null), 2500);

    setPrintStatus('Membuka dialog cetak...');
    const html = generateTechnicalSpecsHtml(updatedJob, specs);
    printHtmlDocument(html, `Data Teknis Gulungan - ${job.id}`);
    setTimeout(() => setPrintStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-4">
        {/* Modal Header */}
        <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Lembar Data Teknis Gulungan Dinamo (Rewinding Data Sheet)
              </h2>
              <p className="text-xs text-slate-500">
                {job.id} · {job.motorBrand} {job.powerHp} HP ({job.powerKw} kW) · {job.customerCompany}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {autoSaveLabel && (
              <span className="text-[11px] font-medium text-emerald-700 whitespace-nowrap">
                {autoSaveLabel}
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              {printStatus || 'Cetak Lembar Kerja'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal data teknis"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 print-card">
          {/* Printable Official Header */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  CV. MUSTOFA JAYA TEKNIK
                </h1>
                <p className="text-[11px] text-slate-600">
                  Spesialis Rewinding & Overhaul Motor Listrik Industri, Generator & Trafo
                </p>
                <p className="text-[10px] text-slate-500">
                  Jl. Raya Industri Narogong KM 12.5 Bantargebang Bekasi · Telp: (021) 8254-9102 / WA: 0812-8877-6652
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-100 px-3 py-1 rounded text-xs font-mono font-bold text-slate-900 border border-slate-200">
                  {job.id}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Tag: <span className="font-semibold text-slate-800">{job.customerUnitTag}</span>
                </div>
              </div>
            </div>
            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 mt-3 pt-2 border-t border-slate-200">
              LEMBAR SPESIFIKASI REKAYASA TEKNIS GULUNGAN STATOR
            </div>
          </div>

          {/* Section 1: Data Nameplate Motor */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              1. Spesifikasi Nameplate Motor Listrik
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">Merk / Manufaktur:</span>
                <span className="font-semibold text-slate-900">{job.motorBrand}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Daya Motor:</span>
                <span className="font-semibold text-slate-900">{job.powerHp} HP ({job.powerKw} kW)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Kecepatan & Kutub:</span>
                <span className="font-semibold text-slate-900">{job.rpm} RPM ({job.poles} Pole)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Tegangan Kerja:</span>
                <span className="font-semibold text-slate-900">{job.voltage} ({job.phase}-Phase)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Tipe Hubungan:</span>
                <span className="font-semibold text-slate-900 font-mono">{job.connection}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Frame Size:</span>
                <span className="font-semibold text-slate-900 font-mono">{job.frameSize}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Nomor Seri:</span>
                <span className="font-semibold text-slate-900 font-mono">{job.serialNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pelanggan:</span>
                <span className="font-semibold text-slate-900 truncate block">{job.customerCompany}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Data Teknis Inti Stator & Gulungan (Editable) */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              2. Konstruksi Alur & Kumparan Stator
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3.5 rounded border border-slate-200">
              {/* Slots */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Jumlah Alur Stator (Slots):
                </label>
                <input
                  type="number"
                  value={specs.slots}
                  onChange={(e) => updateSpecs({ ...specs, slots: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400">Standar: 24, 36, 48, 54, 72</span>
              </div>

              {/* Winding Type */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Tipe Gulungan Kumparan:
                </label>
                <select
                  value={specs.windingType}
                  onChange={(e) => updateSpecs({ ...specs, windingType: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Lap (Jerat)">Lap (Jerat / Tumpang Tindih)</option>
                  <option value="Concentric (Konsentris)">Concentric (Konsentris)</option>
                  <option value="Wave (Gelombang)">Wave (Gelombang)</option>
                </select>
              </div>

              {/* Pitch Span */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Langkah Alur (Pitch Span):
                </label>
                <input
                  type="text"
                  value={specs.pitchSpan}
                  onChange={(e) => updateSpecs({ ...specs, pitchSpan: e.target.value })}
                  placeholder="Contoh: 1 - 8, 1 - 10, 1 - 12"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              {/* Coils per group */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Kumparan per Group (Coils/Group):
                </label>
                <input
                  type="number"
                  value={specs.coilsPerGroup}
                  onChange={(e) => updateSpecs({ ...specs, coilsPerGroup: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Turns per slot */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Jumlah Lilitan per Alur (Turns):
                </label>
                <input
                  type="number"
                  value={specs.turnsPerSlot}
                  onChange={(e) => updateSpecs({ ...specs, turnsPerSlot: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono font-semibold"
                />
              </div>

              {/* Connection Diagram */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Diagram Sambungan Fasa:
                </label>
                <select
                  value={specs.connectionDiagram}
                  onChange={(e) => updateSpecs({ ...specs, connectionDiagram: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  <option value="1 Star (Y)">1 Star (Series Star)</option>
                  <option value="2 Star (YY)">2 Star (Parallel Star)</option>
                  <option value="1 Delta (Δ)">1 Delta (Series Delta)</option>
                  <option value="2 Delta (ΔΔ)">2 Delta (Parallel Delta)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Data Kawat Tembaga & Dimensi */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                3. Spesifikasi Kawat Email Tembaga
              </span>
              <span className="text-[11px] font-mono font-normal text-slate-500">
                Luas Penampang Efektif: <strong className="text-slate-900">{wireArea.toFixed(4)} mm²</strong>
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-amber-50/40 p-3.5 rounded border border-amber-200">
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Diameter Kawat (Ø mm):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={specs.wireDiameterMm}
                  onChange={(e) => handleWireDiameterChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Gauge Kawat (SWG):
                </label>
                <input
                  type="number"
                  value={specs.swg}
                  onChange={(e) => updateSpecs({ ...specs, swg: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Jumlah Kawat Paralel / Rangkap:
                </label>
                <select
                  value={specs.parallelWires}
                  onChange={(e) => updateSpecs({ ...specs, parallelWires: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  <option value={1}>1 Kawat Tunggal</option>
                  <option value={2}>2 Kawat Rangkap (Paralel)</option>
                  <option value={3}>3 Kawat Rangkap (Paralel)</option>
                  <option value={4}>4 Kawat Rangkap (Paralel)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Estimasi Berat Tembaga (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={specs.copperWeightKg}
                  onChange={(e) => updateSpecs({ ...specs, copperWeightKg: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono font-bold text-amber-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Bahan Isolasi & Mekanikal */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              4. Bahan Isolasi, Vernis Oven & Bearing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded border border-slate-200">
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Kelas Isolasi Termal:
                </label>
                <select
                  value={specs.insulationClass}
                  onChange={(e) => updateSpecs({ ...specs, insulationClass: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Class B (130°C)">Class B (130°C)</option>
                  <option value="Class F (155°C)">Class F (155°C - Standar Industri)</option>
                  <option value="Class H (180°C)">Class H (180°C - Heavy Duty)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Bahan Isolasi Alur (Slot Liner):
                </label>
                <select
                  value={specs.slotInsulationType}
                  onChange={(e) => updateSpecs({ ...specs, slotInsulationType: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Nomex 410 (0.25mm)">Nomex 410 (0.25 mm Dupont)</option>
                  <option value="DMD Film (0.30mm)">DMD Film (0.30 mm Dacron Mylar)</option>
                  <option value="Mylar / Poliester">Mylar / Kertas Prespan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Tipe Vernis & Proses Baking:
                </label>
                <input
                  type="text"
                  value={specs.varnishType}
                  onChange={(e) => updateSpecs({ ...specs, varnishType: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Bearing Depan (Drive End - DE):
                </label>
                <input
                  type="text"
                  value={specs.bearingFrontType}
                  onChange={(e) => updateSpecs({ ...specs, bearingFrontType: e.target.value })}
                  placeholder="Contoh: SKF 6308-2RS1 / C3"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Bearing Belakang (Non-Drive End - NDE):
                </label>
                <input
                  type="text"
                  value={specs.bearingRearType}
                  onChange={(e) => updateSpecs({ ...specs, bearingRearType: e.target.value })}
                  placeholder="Contoh: SKF 6208-2RS1 / C3"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Spesifikasi Kabel Keluar (Lead Wire):
                </label>
                <input
                  type="text"
                  value={specs.leadWireSpec}
                  onChange={(e) => updateSpecs({ ...specs, leadWireSpec: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Signatures for Workshop Job Sheet */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Teknisi Penggulung (Rewinder)</p>
              <div className="h-14"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( {job.assignedTechnicians[0] || 'Teknisi Gulung'} )
              </p>
            </div>

            <div>
              <p className="text-slate-500">Teknisi Mekanikal & Bubut</p>
              <div className="h-14"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( Budi Hartono )
              </p>
            </div>

            <div>
              <p className="text-slate-500">Mengetahui, Kepala Bengkel</p>
              <div className="h-14"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( H. Mustofa S.T. )
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
