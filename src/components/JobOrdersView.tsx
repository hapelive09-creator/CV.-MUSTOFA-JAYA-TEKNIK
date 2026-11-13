import React, { useState } from 'react';
import { JobOrder, JobStatus, JobPriority } from '../types';
import { formatRupiah } from '../utils/rewindingCalculators';
import {
  buildBackupFilename,
  downloadCsvFile,
  exportJobOrdersToCsv,
} from '../utils/csvExport';
import {
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Printer,
  ChevronDown,
  Wrench,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Download,
  X,
} from 'lucide-react';

interface JobOrdersViewProps {
  jobs: JobOrder[];
  onSelectJob: (job: JobOrder) => void;
  onOpenSpecs: (job: JobOrder) => void;
  onOpenQC: (job: JobOrder) => void;
  onOpenInvoice: (job: JobOrder) => void;
  onOpenNewJob: () => void;
  onUpdateJobStatus: (jobId: string, newStatus: JobStatus) => void;
}

export const JobOrdersView: React.FC<JobOrdersViewProps> = ({
  jobs,
  onSelectJob,
  onOpenSpecs,
  onOpenQC,
  onOpenInvoice,
  onOpenNewJob,
  onUpdateJobStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handleExportCsv = () => {
    if (filteredJobs.length === 0) return;
    const csv = exportJobOrdersToCsv(filteredJobs);
    const filename = buildBackupFilename('job-orders');
    downloadCsvFile(csv, filename);
    setBackupNotice(
      `Backup CSV berhasil diunduh: ${filename} (${filteredJobs.length} SPK)`
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(search.toLowerCase()) ||
      job.customerCompany.toLowerCase().includes(search.toLowerCase()) ||
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.motorBrand.toLowerCase().includes(search.toLowerCase()) ||
      job.customerUnitTag.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || job.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || job.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityStyle = (priority: JobPriority) => {
    switch (priority) {
      case 'Emergency 24 Jam':
        return 'text-rose-700 bg-rose-50 border-rose-200/90';
      case 'Mendesak':
        return 'text-amber-800 bg-amber-50 border-amber-200/90';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200/90';
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'antrean':
        return (
          <span className="inline-flex items-center text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
            Antrean Masuk
          </span>
        );
      case 'diagnosa':
        return (
          <span className="inline-flex items-center text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
            Bongkar & Diagnosa
          </span>
        );
      case 'penawaran':
        return (
          <span className="inline-flex items-center text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-sky-200/80">
            Penawaran Biaya
          </span>
        );
      case 'insulasi':
        return (
          <span className="inline-flex items-center text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-indigo-200/80">
            Insulasi Slot
          </span>
        );
      case 'gulung':
        return (
          <span className="inline-flex items-center text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200/80">
            Proses Gulung
          </span>
        );
      case 'koneksi_lacing':
        return (
          <span className="inline-flex items-center text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200/80">
            Koneksi & Lacing
          </span>
        );
      case 'varnish_oven':
        return (
          <span className="inline-flex items-center text-orange-900 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-orange-200/80">
            Varnish & Oven
          </span>
        );
      case 'mekanikal_bearing':
        return (
          <span className="inline-flex items-center text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
            Bearing & As
          </span>
        );
      case 'qc_testing':
        return (
          <span className="inline-flex items-center text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-200/80">
            Pengujian Megger
          </span>
        );
      case 'siap_kirim':
        return (
          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200/80">
            Siap Kirim
          </span>
        );
      case 'diserahkan':
        return (
          <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
            Telah Diambil
          </span>
        );
    }
  };

  const statusOptions: { value: JobStatus; label: string }[] = [
    { value: 'antrean', label: '1. Antrean Masuk' },
    { value: 'diagnosa', label: '2. Bongkar & Diagnosa' },
    { value: 'penawaran', label: '3. Penawaran Biaya' },
    { value: 'insulasi', label: '4. Insulasi Slot' },
    { value: 'gulung', label: '5. Proses Gulung Stator' },
    { value: 'koneksi_lacing', label: '6. Koneksi & Lacing' },
    { value: 'varnish_oven', label: '7. Varnish & Oven Baking' },
    { value: 'mekanikal_bearing', label: '8. Bearing & Mekanikal' },
    { value: 'qc_testing', label: '9. Uji Megger & QC' },
    { value: 'siap_kirim', label: '10. Selesai & Siap Kirim' },
    { value: 'diserahkan', label: '11. Telah Diambil Pelanggan' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No SPK, Pabrik, PIC, Merk, Tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          >
            <option value="all">Semua Status Tahapan</option>
            <option value="antrean">1. Antrean Masuk</option>
            <option value="diagnosa">2. Bongkar & Diagnosa</option>
            <option value="gulung">3. Proses Gulung Stator</option>
            <option value="varnish_oven">4. Varnish & Oven</option>
            <option value="mekanikal_bearing">5. Bearing & Bubut</option>
            <option value="qc_testing">6. Uji Megger & QC</option>
            <option value="siap_kirim">7. Selesai & Siap Kirim</option>
            <option value="diserahkan">8. Selesai & Diserahkan</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          >
            <option value="all">Semua Prioritas</option>
            <option value="Emergency 24 Jam">Emergency 24 Jam</option>
            <option value="Mendesak">Mendesak</option>
            <option value="Biasa">Biasa</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredJobs.length === 0}
            aria-label="Ekspor Job Order ke CSV"
            title="Unduh backup data Job Order (SPK) dalam format CSV"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor CSV ({filteredJobs.length})
          </button>

          <button
            onClick={onOpenNewJob}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            + Tambah SPK Baru
          </button>
        </div>
      </div>

      {backupNotice && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBackupNotice(null)}
            aria-label="Tutup notifikasi ekspor CSV job order"
            className="text-emerald-700 hover:text-emerald-950 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. SPK & Tanggal</th>
                <th className="py-3 px-4">Pelanggan / Pabrik</th>
                <th className="py-3 px-4">Spesifikasi Motor</th>
                <th className="py-3 px-4">Diagnosa Kerusakan</th>
                <th className="py-3 px-4">Teknisi & Prioritas</th>
                <th className="py-3 px-4">Tahapan Servis</th>
                <th className="py-3 px-4 text-right">Biaya & Pembayaran</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">Tidak ada SPK yang sesuai filter</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Ubah kata kunci pencarian atau reset filter</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
                  const parts =
                    copperCost +
                    job.costs.bearingFrontCost +
                    job.costs.bearingRearCost +
                    job.costs.insulationAndVarnishCost +
                    job.costs.machiningCost;
                  const total = parts + job.costs.laborCost;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Column 1: SPK */}
                      <td className="py-3.5 px-4 align-top">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="font-mono font-bold text-slate-900 hover:text-amber-700 block text-left"
                        >
                          {job.id}
                        </button>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tgl: {job.orderDate}
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium">
                          Target: {job.targetDate}
                        </div>
                      </td>

                      {/* Column 2: Customer */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 truncate max-w-[190px]">
                          {job.customerCompany}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                          {job.customerName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {job.customerPhone}
                        </div>
                      </td>

                      {/* Column 3: Motor Specs */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {job.motorBrand}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM · {job.poles}P
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {job.voltage} · {job.connection} · {job.customerUnitTag}
                        </div>
                      </td>

                      {/* Column 4: Diagnosis */}
                      <td className="py-3.5 px-4 align-top max-w-[210px]">
                        <div className="line-clamp-2 text-slate-700 text-[11px]" title={job.initialDiagnosis.visualCheck}>
                          {job.initialDiagnosis.visualCheck}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                          {job.initialDiagnosis.statorBurned && (
                            <span className="text-rose-600 font-semibold">Stator Terbakar</span>
                          )}
                          {job.initialDiagnosis.bearingDamaged && (
                            <span className="text-amber-800 font-semibold">· Bearing Rusak</span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Technicians & Priority */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mb-1.5 ${getPriorityStyle(
                            job.priority
                          )}`}
                        >
                          {job.priority}
                        </span>
                        <div className="text-[11px] text-slate-600 truncate max-w-[140px]">
                          {job.assignedTechnicians.join(', ')}
                        </div>
                      </td>

                      {/* Column 6: Status Selector */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          {getStatusBadge(job.status)}
                          <select
                            value={job.status}
                            onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                            className="block w-full text-[11px] bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Column 7: Costs & Payment */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="font-mono font-bold text-slate-900 tabular-nums text-xs">
                          {formatRupiah(total)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Kawat: {job.technicalSpecs.copperWeightKg} kg
                        </div>
                        <span
                          className={`inline-block text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded ${
                            job.paymentStatus === 'Lunas'
                              ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80'
                              : job.paymentStatus === 'DP Diterima'
                              ? 'text-sky-800 bg-sky-50 border border-sky-200/80'
                              : 'text-amber-800 bg-amber-50 border border-amber-200/80'
                          }`}
                        >
                          {job.paymentStatus}
                        </span>
                      </td>

                      {/* Column 8: Quick Action Buttons */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenSpecs(job)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md border border-slate-200/80 hover:border-amber-200 transition-colors"
                            title="Lembar Data Teknis Gulungan"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenQC(job)}
                            className={`p-1.5 rounded-md border transition-colors ${
                              job.testReport
                                ? 'text-emerald-600 bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100'
                                : 'text-slate-500 border-slate-200/80 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200'
                            }`}
                            title={job.testReport ? 'Lihat & Cetak Sertifikat QC' : 'Input Hasil Uji Megger & QC'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenInvoice(job)}
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-md border border-slate-200/80 hover:border-sky-200 transition-colors"
                            title="Cetak Invoice / Penawaran Biaya"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
