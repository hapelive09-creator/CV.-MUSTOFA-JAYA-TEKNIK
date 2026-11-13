import React, { useEffect, useRef, useState } from 'react';
import { JobOrder, PaymentStatus } from '../types';
import { AppsScriptResponse } from '../services/appsScriptService';
import { formatRupiah } from '../utils/rewindingCalculators';
import { WORKSHOP_PROFILE } from '../data/mockData';
import { generateInvoiceHtml, printHtmlDocument } from '../utils/printDocuments';
import {
  X,
  Printer,
  Save,
  Receipt,
  CreditCard,
} from 'lucide-react';

interface InvoicePrintModalProps {
  job: JobOrder;
  onClose: () => void;
  onSaveJobCosts: (updatedJob: JobOrder, closeAfterSave?: boolean) => Promise<AppsScriptResponse> | void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  job,
  onClose,
  onSaveJobCosts,
}) => {
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [costs] = useState({ ...job.costs });
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(job.paymentStatus);
  const [dpAmount, setDpAmount] = useState<number>(job.dpAmount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const hasEditedRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const latestJobRef = useRef(job);
  const latestOnSaveRef = useRef(onSaveJobCosts);
  latestJobRef.current = job;
  latestOnSaveRef.current = onSaveJobCosts;

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
        costs,
        paymentStatus,
        dpAmount,
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
  }, [costs, paymentStatus, dpAmount]);

  const copperCost = costs.copperWireKg * costs.copperPricePerKg;
  const partsSubtotal =
    copperCost +
    costs.bearingFrontCost +
    costs.bearingRearCost +
    costs.insulationAndVarnishCost +
    costs.machiningCost +
    costs.transportCost;
  const subtotal = partsSubtotal + costs.laborCost;
  const taxAmount = (subtotal * costs.taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;
  const remainingDue = grandTotal - dpAmount;

  const handleSave = async () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    hasEditedRef.current = false;
    setAutoSaveLabel(null);
    await onSaveJobCosts(
      {
        ...job,
        costs,
        paymentStatus,
        dpAmount,
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
      costs,
      paymentStatus,
      dpAmount,
    };
    const res = await onSaveJobCosts(updatedJob, false);
    setAutoSaveLabel(
      res && res.status === 'error'
        ? 'Gagal auto-save ke Sheets'
        : 'Tersimpan ke database'
    );
    window.setTimeout(() => setAutoSaveLabel(null), 2500);

    setPrintStatus('Membuka dialog cetak...');
    const html = generateInvoiceHtml(updatedJob, docType, costs, paymentStatus, dpAmount);
    printHtmlDocument(
      html,
      `${docType === 'invoice' ? 'Faktur Tagihan' : 'Penawaran Harga'} - ${job.id}`
    );
    setTimeout(() => setPrintStatus(null), 2500);
  };

  const spkCode = job.id.split('-').pop() || '001';
  const invoiceNumber = `INV/${new Date().getFullYear()}/${spkCode}`;
  const quotationNumber = `QUO/${new Date().getFullYear()}/${spkCode}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col my-4">
        {/* Modal Top Bar */}
        <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {docType === 'invoice' ? 'Faktur Tagihan Resmi (Invoice)' : 'Surat Penawaran Harga (Quotation)'}
              </h2>
              <p className="text-xs text-slate-500">
                {job.id} · {job.customerCompany} · {job.motorBrand} {job.powerHp} HP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {autoSaveLabel && (
              <span className="text-[11px] font-medium text-emerald-700 whitespace-nowrap">
                {autoSaveLabel}
              </span>
            )}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-xs shrink-0">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${docType === 'invoice' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Faktur (Invoice)
              </button>
              <button
                type="button"
                onClick={() => setDocType('quotation')}
                className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${docType === 'quotation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Penawaran (Quo)
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              {printStatus || 'Cetak Dokumen'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {isSaved ? 'Tersimpan!' : 'Simpan Biaya'}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal faktur"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Page */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 print-card font-sans">
          {/* Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {WORKSHOP_PROFILE.companyName}
                </h1>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                  {WORKSHOP_PROFILE.tagline}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {WORKSHOP_PROFILE.address}, {WORKSHOP_PROFILE.city}
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp: {WORKSHOP_PROFILE.phone} · WhatsApp: {WORKSHOP_PROFILE.whatsapp} · Email: {WORKSHOP_PROFILE.email}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {WORKSHOP_PROFILE.legalNumber}
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-black uppercase text-slate-900 tracking-wide">
                  {docType === 'invoice' ? 'FAKTUR TAGIHAN' : 'SURAT PENAWARAN HARGA'}
                </div>
                <div className="font-mono text-xs font-bold text-slate-700 mt-1">
                  No: {docType === 'invoice' ? invoiceNumber : quotationNumber}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Tanggal: <strong>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  Ref SPK: <strong className="font-mono">{job.id}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Unit Recipient Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ditujukan Kepada (Pelanggan):
              </span>
              <div className="text-sm font-bold text-slate-900">{job.customerCompany}</div>
              <div className="text-xs text-slate-700">{job.customerName}</div>
              <div className="text-[11px] text-slate-500">{job.customerPhone}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Identitas Unit Motor Listrik:
              </span>
              <div className="text-xs font-semibold text-slate-900">
                {job.motorBrand} · {job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM
              </div>
              <div className="text-[11px] text-slate-600">
                Tegangan: {job.voltage} · Frame: {job.frameSize} · Pole: {job.poles}P
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                No. Tag Pabrik: <strong>{job.customerUnitTag}</strong> (SN: {job.serialNumber})
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8 text-center">No</th>
                  <th className="py-2.5 px-3">Uraian Pekerjaan / Material Suku Cadang</th>
                  <th className="py-2.5 px-3 text-center w-24">Jumlah</th>
                  <th className="py-2.5 px-3 text-right w-32">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right w-36">Total Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Item 1: Jasa Rewinding */}
                <tr>
                  <td className="py-2 px-3 text-center text-slate-500">1</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">
                      Jasa Rewinding Stator & Overhaul Total Motor Listrik
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Bongkar-pasang, pembersihan core stator, lilit ulang kawat tembaga {job.technicalSpecs.insulationClass}, perendaman vernis oven & uji running test 60 menit.
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">1 Unit</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(costs.laborCost)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(costs.laborCost)}
                  </td>
                </tr>

                {/* Item 2: Kawat Email */}
                <tr>
                  <td className="py-2 px-3 text-center text-slate-500">2</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">
                      Kawat Email Tembaga Murni Supreme / Essex (Ø {job.technicalSpecs.wireDiameterMm} mm)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standar tembaga murni 99.9% konduktivitas tinggi tahan panas 200°C.
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">
                    {costs.copperWireKg} kg
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(costs.copperPricePerKg)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(copperCost)}
                  </td>
                </tr>

                {/* Item 3: Bearing Depan (DE) */}
                <tr>
                  <td className="py-2 px-3 text-center text-slate-500">3</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">
                      Penggantian Bearing Depan (Drive End)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tipe: {job.technicalSpecs.bearingFrontType} (Original Made in Europe)
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">1 pcs</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(costs.bearingFrontCost)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(costs.bearingFrontCost)}
                  </td>
                </tr>

                {/* Item 4: Bearing Belakang (NDE) */}
                <tr>
                  <td className="py-2 px-3 text-center text-slate-500">4</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">
                      Penggantian Bearing Belakang (Non-Drive End)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tipe: {job.technicalSpecs.bearingRearType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">1 pcs</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(costs.bearingRearCost)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(costs.bearingRearCost)}
                  </td>
                </tr>

                {/* Item 5: Bahan Isolasi & Vernis */}
                <tr>
                  <td className="py-2 px-3 text-center text-slate-500">5</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900 block">
                      Bahan Isolasi Nomex/DMD, Kabel Silikon & Vernis Oven Baking
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {job.technicalSpecs.slotInsulationType}, selongsong fiberglass & resin Dr. Beck.
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">1 Lot</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(costs.insulationAndVarnishCost)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(costs.insulationAndVarnishCost)}
                  </td>
                </tr>

                {/* Item 6: Machining jika ada */}
                {costs.machiningCost > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-center text-slate-500">6</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-900 block">
                        Jasa Bubut Dudukan Bearing / Balancing Dinamis Rotor
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">1 Lot</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatRupiah(costs.machiningCost)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(costs.machiningCost)}
                    </td>
                  </tr>
                )}

                {/* Item 7: Transport jika ada */}
                {costs.transportCost > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-center text-slate-500">
                      {costs.machiningCost > 0 ? '7' : '6'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-900 block">
                        Biaya Transportasi Antar-Jemput Unit Workshop ke Pabrik
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">1 Trip</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatRupiah(costs.transportCost)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(costs.transportCost)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Split: Bank Account & Total Summary */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Payment Details */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Instruksi Pembayaran Transfer Bank:
              </div>
              <div className="text-slate-700 space-y-0.5">
                <div>Bank Tujuan: <strong>{WORKSHOP_PROFILE.bankAccount.bankName}</strong></div>
                <div>Nomor Rekening: <strong className="font-mono text-sm">{WORKSHOP_PROFILE.bankAccount.accountNumber}</strong></div>
                <div>Atas Nama: <strong>{WORKSHOP_PROFILE.bankAccount.accountHolder}</strong></div>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                * Mohon cantumkan nomor faktur <strong>{invoiceNumber}</strong> pada berita transfer. Bukti transfer dapat dikirimkan ke WhatsApp 0812-8877-6652.
              </p>
            </div>

            {/* Price Calculation Box */}
            <div className="bg-white p-4 rounded border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Jasa & Suku Cadang:</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>PPN ({costs.taxPercent}%):</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>TOTAL AKHIR:</span>
                <span className="text-blue-700 text-base">{formatRupiah(grandTotal)}</span>
              </div>

              {dpAmount > 0 && (
                <>
                  <div className="flex justify-between text-emerald-700 pt-1">
                    <span>Uang Muka (DP) Diterima:</span>
                    <span>- {formatRupiah(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span>SISA TAGIHAN:</span>
                    <span className="text-amber-800">{formatRupiah(remainingDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500">Tanda Terima Pelanggan / Pabrik</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-8 pt-1">
                ( {job.customerName} )
              </p>
            </div>

            <div>
              <p className="text-slate-500">Hormat Kami, CV. Mustofa Jaya Teknik</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-900 border-t border-slate-300 inline-block px-8 pt-1">
                ( {WORKSHOP_PROFILE.managerName} )
              </p>
              <div className="text-[10px] text-slate-400">Pimpinan / Direktur Utama</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls for editing costs */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="font-medium text-slate-700">Status Pembayaran:</label>
            <select
              value={paymentStatus}
              onChange={(e) => {
                hasEditedRef.current = true;
                setPaymentStatus(e.target.value as PaymentStatus);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-xs"
            >
              <option value="Belum Ditagih">Belum Ditagih</option>
              <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
              <option value="DP Diterima">DP Diterima</option>
              <option value="Lunas">Lunas (Selesai Dibayar)</option>
            </select>

            {paymentStatus === 'DP Diterima' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Nominal DP:</span>
                <input
                  type="number"
                  value={dpAmount}
                  onChange={(e) => {
                    hasEditedRef.current = true;
                    setDpAmount(Number(e.target.value));
                  }}
                  className="w-32 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
          >
            Simpan Perubahan Biaya
          </button>
        </div>
      </div>
    </div>
  );
};
