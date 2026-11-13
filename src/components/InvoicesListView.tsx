import React, { useState } from 'react';
import { JobOrder, PaymentStatus } from '../types';
import { formatRupiah } from '../utils/rewindingCalculators';
import { generateFinancialRecapHtml, printHtmlDocument } from '../utils/printDocuments';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
} from 'lucide-react';

interface InvoicesListViewProps {
  jobs: JobOrder[];
  onOpenInvoice: (job: JobOrder) => void;
  onUpdatePaymentStatus: (jobId: string, status: PaymentStatus) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  jobs,
  onOpenInvoice,
  onUpdatePaymentStatus,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handlePrintRecap = () => {
    setPrintStatus('Membuka dialog cetak...');
    const html = generateFinancialRecapHtml(filteredJobs, jobs, filterStatus);
    printHtmlDocument(html, 'Cetak Rekap Keuangan Bengkel');
    setTimeout(() => setPrintStatus(null), 2500);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(search.toLowerCase()) ||
      job.customerCompany.toLowerCase().includes(search.toLowerCase()) ||
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.motorBrand.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || job.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Financial aggregates
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalPending = 0;

  jobs.forEach((job) => {
    const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
    const parts =
      copperCost +
      job.costs.bearingFrontCost +
      job.costs.bearingRearCost +
      job.costs.insulationAndVarnishCost +
      job.costs.machiningCost +
      job.costs.transportCost;
    const subtotal = parts + job.costs.laborCost;
    const grand = subtotal + (subtotal * job.costs.taxPercent) / 100;

    totalRevenue += grand;
    if (job.paymentStatus === 'Lunas') {
      totalPaid += grand;
    } else if (job.paymentStatus === 'DP Diterima') {
      const dp = job.dpAmount || 0;
      totalPaid += dp;
      totalPending += grand - dp;
    } else {
      totalPending += grand;
    }
  });

  return (
    <div className="space-y-4">
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-slate-600 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Nilai Tagihan (Omset)
          </span>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Seluruh order & SPK aktif di bengkel
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-emerald-500 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Kas Diterima (Lunas & DP)
          </span>
          <div className="text-xl md:text-2xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">
            {formatRupiah(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-slate-100">
            Pembayaran telah masuk rekening Bank Mandiri
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 border-t-3 border-t-amber-500 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Piutang / Menunggu Pembayaran
          </span>
          <div className="text-xl md:text-2xl font-extrabold text-amber-700 mt-1 font-mono tabular-nums">
            {formatRupiah(totalPending)}
          </div>
          <div className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-slate-100">
            Tagihan jatuh tempo & penawaran belum dibayar
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SPK, Pabrik, PIC, Merk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          >
            <option value="all">Semua Status Pembayaran</option>
            <option value="Belum Ditagih">Belum Ditagih</option>
            <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
            <option value="DP Diterima">DP Diterima</option>
            <option value="Lunas">Lunas (Selesai)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handlePrintRecap}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg shadow-2xs transition-colors self-end md:self-auto whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          {printStatus || 'Cetak Rekap Keuangan'}
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Faktur / Ref SPK</th>
                <th className="py-3 px-4">Pelanggan / Pabrik</th>
                <th className="py-3 px-4">Unit Motor Listrik</th>
                <th className="py-3 px-4 text-right">Rincian Nilai Tagihan</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4 text-center">Aksi Faktur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
                const parts =
                  copperCost +
                  job.costs.bearingFrontCost +
                  job.costs.bearingRearCost +
                  job.costs.insulationAndVarnishCost +
                  job.costs.machiningCost +
                  job.costs.transportCost;
                const subtotal = parts + job.costs.laborCost;
                const grandTotal = subtotal + (subtotal * job.costs.taxPercent) / 100;

                const spkCode = job.id.split('-').pop() || '001';
                const invNo = `INV/${new Date().getFullYear()}/${spkCode}`;

                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 align-top">
                      <button
                        onClick={() => onOpenInvoice(job)}
                        className="font-mono font-bold text-sky-700 hover:underline block text-left"
                      >
                        {invNo}
                      </button>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Ref: {job.id}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tgl: {job.orderDate}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {job.customerCompany}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {job.customerName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900">
                        {job.motorBrand} {job.powerHp} HP ({job.powerKw} kW)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Tag: {job.customerUnitTag} · {job.rpm} RPM
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                        {formatRupiah(grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Jasa: {formatRupiah(job.costs.laborCost)} · Parts: {formatRupiah(parts)}
                      </div>
                      {job.dpAmount && job.dpAmount > 0 && (
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-semibold">
                          DP: {formatRupiah(job.dpAmount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <select
                        value={job.paymentStatus}
                        onChange={(e) =>
                          onUpdatePaymentStatus(job.id, e.target.value as PaymentStatus)
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:ring-1 focus:ring-amber-500 ${
                          job.paymentStatus === 'Lunas'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : job.paymentStatus === 'DP Diterima'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="Belum Ditagih">Belum Ditagih</option>
                        <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                        <option value="DP Diterima">DP Diterima</option>
                        <option value="Lunas">Lunas</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <button
                        onClick={() => onOpenInvoice(job)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-colors shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        Buka Faktur
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
