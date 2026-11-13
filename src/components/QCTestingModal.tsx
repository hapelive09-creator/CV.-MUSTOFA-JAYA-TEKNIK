import React, { useEffect, useRef, useState } from 'react';
import { JobOrder, TestReport } from '../types';
import { AppsScriptResponse } from '../services/appsScriptService';
import { calculateResistanceBalanceDelta } from '../utils/rewindingCalculators';
import { printCertificateDocument, generateCertificateHtml } from '../utils/printCertificate';
import {
  X,
  Printer,
  Save,
  Activity,
  Gauge,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface QCTestingModalProps {
  job: JobOrder;
  onClose: () => void;
  onSave: (updatedJob: JobOrder, closeAfterSave?: boolean) => Promise<AppsScriptResponse> | void;
}

export const QCTestingModal: React.FC<QCTestingModalProps> = ({
  job,
  onClose,
  onSave,
}) => {
  const defaultReport: TestReport = job.testReport || {
    testDate: new Date().toISOString().split('T')[0],
    testerName: 'Rian Firdaus (QC Electrical)',
    meggerVoltageV: 1000,
    meggerStatorBodyMohm: 650,
    meggerPhasePhaseMohm: {
      rs: 620,
      st: 640,
      tr: 630,
    },
    windingResistanceOhm: {
      uv: 0.45,
      vw: 0.45,
      wu: 0.45,
    },
    noLoadTest: {
      appliedVoltageV: 380,
      currentR_Amps: 8.5,
      currentS_Amps: 8.4,
      currentT_Amps: 8.5,
      actualRpm: 1480,
      vibrationDE_mm_s: 1.1,
      vibrationNDE_mm_s: 0.95,
      tempDE_C: 42.0,
      tempNDE_C: 39.5,
    },
    overallResult: 'Lolos QC (Passed)',
    qcNotes: 'Motor diuji jalan tanpa beban selama 60 menit. Putaran halus, arus fasa seimbang, getaran rendah sesuai standar ISO 10816 Grade A.',
    warrantyMonths: 6,
  };

  const [report, setReport] = useState<TestReport>(defaultReport);
  const [isSaved, setIsSaved] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const hasEditedRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const latestJobRef = useRef(job);
  const latestOnSaveRef = useRef(onSave);
  latestJobRef.current = job;
  latestOnSaveRef.current = onSave;

  const updateReport = (updater: TestReport | ((prev: TestReport) => TestReport)) => {
    hasEditedRef.current = true;
    setReport(updater);
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
        testReport: report,
        status: report.overallResult === 'Lolos QC (Passed)' ? 'siap_kirim' : 'qc_testing',
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
  }, [report]);

  // Resistance Balance Calculation
  const balanceCheck = calculateResistanceBalanceDelta(
    report.windingResistanceOhm.uv,
    report.windingResistanceOhm.vw,
    report.windingResistanceOhm.wu
  );

  // Megger Health Evaluation
  const isMeggerPassed = report.meggerStatorBodyMohm >= 100;

  // Vibration ISO 10816 evaluation
  const maxVibration = Math.max(
    report.noLoadTest.vibrationDE_mm_s,
    report.noLoadTest.vibrationNDE_mm_s
  );
  const isVibrationGood = maxVibration < 2.8;

  const handleSave = async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    hasEditedRef.current = false;
    setAutoSaveLabel(null);
    await onSave(
      {
        ...job,
        testReport: report,
        status: report.overallResult === 'Lolos QC (Passed)' ? 'siap_kirim' : 'qc_testing',
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
      testReport: report,
      status: report.overallResult === 'Lolos QC (Passed)' ? 'siap_kirim' : 'qc_testing',
    };
    const res = await onSave(updatedJob, false);
    setAutoSaveLabel(
      res && res.status === 'error'
        ? 'Gagal auto-save ke Sheets'
        : 'Tersimpan ke database'
    );
    window.setTimeout(() => setAutoSaveLabel(null), 2500);

    setPrintStatus('Membuka dialog cetak...');
    printCertificateDocument(updatedJob, report);
    setTimeout(() => setPrintStatus(null), 3000);
  };

  const handleDownloadCertificateHtml = () => {
    const html = generateCertificateHtml(job, report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sertifikat-QC-${job.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-4">
        {/* Header Bar */}
        <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Laporan Uji Kelayakan & Sertifikat QC Motor Listrik
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
              id="btn-cetak-qc"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors whitespace-nowrap shrink-0"
              title="Cetak Berita Acara & Sertifikat QC Resmi"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              {printStatus || 'Cetak Sertifikat QC'}
            </button>
            <button
              type="button"
              onClick={handleDownloadCertificateHtml}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Unduh Lembar Sertifikat QC dalam format HTML siap cetak"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Unduh HTML
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {isSaved ? 'Tersimpan!' : 'Simpan Laporan QC'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal QC"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 print-card">
          {/* Certificate Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  CV. MUSTOFA JAYA TEKNIK
                </h1>
                <p className="text-[11px] font-semibold text-amber-700">
                  Divisi Quality Control & Pengujian Motor Listrik Industri
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Jl. Raya Industri Narogong KM 12.5 Bantargebang Bekasi · Telp: (021) 8254-9102 / WA: 0812-8877-6652
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  BERITA ACARA PENGUJIAN
                </div>
                <div className="font-mono text-xs text-slate-600 font-bold mt-0.5">
                  QC-CERT/{new Date().getFullYear()}/{job.id.split('-').pop() || '001'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tanggal Uji: <strong>{report.testDate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Table */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <span className="text-[10px] text-slate-500 block">Unit Pelanggan:</span>
              <strong className="text-slate-900 truncate block">{job.customerCompany}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Merk & Tipe Motor:</span>
              <strong className="text-slate-900">{job.motorBrand} ({job.frameSize})</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Kapasitas Daya / RPM:</span>
              <strong className="text-slate-900">{job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Nomor Seri / Tag:</span>
              <strong className="text-slate-900 font-mono">{job.serialNumber} / {job.customerUnitTag}</strong>
            </div>
          </div>

          {/* Test 1: Megger Insulation Test */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                1. Uji Tahanan Isolasi Megger (Insulation Resistance Test)
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isMeggerPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {isMeggerPassed ? '✓ Standar IEEE 43 Terpenuhi (>100 MΩ)' : '✗ Tahanan Isolasi Kurang'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tegangan Uji (Test Voltage):</label>
                <select
                  value={report.meggerVoltageV}
                  onChange={(e) => updateReport({ ...report, meggerVoltageV: Number(e.target.value) })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-semibold"
                >
                  <option value={500}>500 V DC</option>
                  <option value={1000}>1000 V DC (Standar)</option>
                  <option value={2500}>2500 V DC</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Stator ke Ground (Body):</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={report.meggerStatorBodyMohm}
                    onChange={(e) => updateReport({ ...report, meggerStatorBodyMohm: Number(e.target.value) })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-slate-500 font-mono">MΩ</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Antar Fasa R - S:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={report.meggerPhasePhaseMohm.rs}
                    onChange={(e) => updateReport({
                      ...report,
                      meggerPhasePhaseMohm: { ...report.meggerPhasePhaseMohm, rs: Number(e.target.value) },
                    })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                  <span className="text-slate-500 font-mono">MΩ</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Antar Fasa S - T / T - R:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={report.meggerPhasePhaseMohm.st}
                    onChange={(e) => updateReport({
                      ...report,
                      meggerPhasePhaseMohm: { ...report.meggerPhasePhaseMohm, st: Number(e.target.value) },
                    })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                  <span className="text-slate-500 font-mono">MΩ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test 2: Winding Resistance & Balance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                2. Uji Keseimbangan Tahanan Kumparan Fasa (Winding Resistance)
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${balanceCheck.isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                Ketidakseimbangan: {balanceCheck.maxDeltaPct}% ({balanceCheck.isBalanced ? 'Seimbang ≤ 3%' : 'Perlu Diperiksa'})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tahanan Terminal U - V:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.001"
                    value={report.windingResistanceOhm.uv}
                    onChange={(e) => updateReport({
                      ...report,
                      windingResistanceOhm: { ...report.windingResistanceOhm, uv: Number(e.target.value) },
                    })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-semibold"
                  />
                  <span className="text-slate-500 font-mono">Ω</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tahanan Terminal V - W:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.001"
                    value={report.windingResistanceOhm.vw}
                    onChange={(e) => updateReport({
                      ...report,
                      windingResistanceOhm: { ...report.windingResistanceOhm, vw: Number(e.target.value) },
                    })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-semibold"
                  />
                  <span className="text-slate-500 font-mono">Ω</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tahanan Terminal W - U:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.001"
                    value={report.windingResistanceOhm.wu}
                    onChange={(e) => updateReport({
                      ...report,
                      windingResistanceOhm: { ...report.windingResistanceOhm, wu: Number(e.target.value) },
                    })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-semibold"
                  />
                  <span className="text-slate-500 font-mono">Ω</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test 3: No-Load Running Test */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
              3. Uji Operasional Tanpa Beban (No-Load Running Test 60 Menit)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tegangan Terpasang:</label>
                <input
                  type="number"
                  value={report.noLoadTest.appliedVoltageV}
                  onChange={(e) => updateReport({
                    ...report,
                    noLoadTest: { ...report.noLoadTest, appliedVoltageV: Number(e.target.value) },
                  })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Arus Fasa R / S / T:</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={report.noLoadTest.currentR_Amps}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, currentR_Amps: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Fasa R"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={report.noLoadTest.currentS_Amps}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, currentS_Amps: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Fasa S"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={report.noLoadTest.currentT_Amps}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, currentT_Amps: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Fasa T"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Vibrasi DE & NDE (mm/s):</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={report.noLoadTest.vibrationDE_mm_s}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, vibrationDE_mm_s: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Drive End"
                  />
                  <input
                    type="number"
                    step="0.05"
                    value={report.noLoadTest.vibrationNDE_mm_s}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, vibrationNDE_mm_s: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Non-Drive End"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Suhu Bearing DE/NDE (°C):</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    value={report.noLoadTest.tempDE_C}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, tempDE_C: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Suhu DE"
                  />
                  <input
                    type="number"
                    value={report.noLoadTest.tempNDE_C}
                    onChange={(e) => updateReport({
                      ...report,
                      noLoadTest: { ...report.noLoadTest, tempNDE_C: Number(e.target.value) },
                    })}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    title="Suhu NDE"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Verdict & Warranty */}
          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-900 block mb-1">
                  Keputusan Akhir Quality Control:
                </label>
                <select
                  value={report.overallResult}
                  onChange={(e) => updateReport({ ...report, overallResult: e.target.value as any })}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Lolos QC (Passed)">✓ Lolos Uji Kelayakan Operasi (Passed)</option>
                  <option value="Perlu Perbaikan (Failed)">✗ Belum Memenuhi Syarat (Failed)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-900 block mb-1">
                  Jaminan Garansi Servis (Bulan):
                </label>
                <select
                  value={report.warrantyMonths}
                  onChange={(e) => updateReport({ ...report, warrantyMonths: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value={3}>Garansi 3 Bulan (Standar)</option>
                  <option value={6}>Garansi 6 Bulan (Heavy Duty)</option>
                  <option value={12}>Garansi 12 Bulan (Overhaul Total Baru)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Catatan Hasil Pengujian:</label>
              <textarea
                rows={2}
                value={report.qcNotes}
                onChange={(e) => updateReport({ ...report, qcNotes: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Quality Control Tester</p>
              <div className="h-12"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( {report.testerName} )
              </p>
            </div>

            <div>
              <p className="text-slate-500">Kepala Bengkel Rewinding</p>
              <div className="h-12"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( H. Mustofa S.T. )
              </p>
            </div>

            <div className="hidden sm:block">
              <p className="text-slate-500">Perwakilan Pelanggan / PIC</p>
              <div className="h-12"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-6 pt-1">
                ( {job.customerName} )
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">Status Pengujian:</span>
            <span
              className={`font-semibold px-2.5 py-1 rounded border ${
                report.overallResult === 'Lolos QC (Passed)'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {report.overallResult} ({report.warrantyMonths} Bulan Garansi)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCertificateHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              Unduh HTML
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              {printStatus || 'Cetak Sertifikat QC Sekarang'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
