import React, { useState, useEffect, useRef } from 'react';
import { JobOrder, Customer, InventoryItem, Technician, JobStatus, PaymentStatus } from './types';
import {
  INITIAL_JOBS,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_TECHNICIANS,
  WORKSHOP_PROFILE,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { JobOrdersView } from './components/JobOrdersView';
import { JobKanbanView } from './components/JobKanbanView';
import { TechnicalSpecsModal } from './components/TechnicalSpecsModal';
import { QCTestingModal } from './components/QCTestingModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { RewindingCalculatorModal } from './components/RewindingCalculatorModal';
import { NewJobModal } from './components/NewJobModal';
import { InventoryView } from './components/InventoryView';
import { InvoicesListView } from './components/InvoicesListView';
import { CustomersView } from './components/CustomersView';
import { AppsScriptView } from './components/AppsScriptView';
import {
  generateActiveViewReportHtml,
  generateInvoiceHtml,
  generateTechnicalSpecsHtml,
  printHtmlDocument,
} from './utils/printDocuments';
import { printCertificateDocument } from './utils/printCertificate';
import {
  AppsScriptResponse,
  mapSheetRowsToInventory,
  saveCustomerToAppsScript,
  saveInventoryItemToAppsScript,
  saveJobReportToAppsScript,
} from './services/appsScriptService';

export default function App() {
  // Load from localStorage or mockData
  const [jobs, setJobs] = useState<JobOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mustofa_jobs_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_JOBS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mustofa_inventory_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INVENTORY;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('mustofa_customers_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [technicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedJobForSpecs, setSelectedJobForSpecs] = useState<JobOrder | null>(null);
  const [selectedJobForQC, setSelectedJobForQC] = useState<JobOrder | null>(null);
  const [selectedJobForInvoice, setSelectedJobForInvoice] = useState<JobOrder | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [autoSaveNotice, setAutoSaveNotice] = useState<{
    status: 'success' | 'error';
    message: string;
    retry?: () => Promise<void>;
  } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const notifyAutoSaveResult = (
    res: AppsScriptResponse,
    retryFn?: () => Promise<void>
  ) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    if (res.status === 'success') {
      setAutoSaveNotice({
        status: 'success',
        message: res.message,
      });
      noticeTimerRef.current = window.setTimeout(() => {
        setAutoSaveNotice(null);
      }, 4500);
    } else {
      setAutoSaveNotice({
        status: 'error',
        message: res.message,
        retry: retryFn,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mustofa_jobs_data', JSON.stringify(jobs));
    } catch (e) {
      console.error(e);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('mustofa_inventory_data', JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('mustofa_customers_data', JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  // Calculations for Badges
  const activeJobsCount = jobs.filter(
    (j) => j.status !== 'siap_kirim' && j.status !== 'diserahkan'
  ).length;
  const lowStockCount = inventory.filter((i) => i.stock <= i.minStockAlert).length;
  const pendingQCCount = jobs.filter(
    (j) => j.status === 'qc_testing' || (j.status === 'varnish_oven' && !j.testReport)
  ).length;
  const urgentJobsCount = jobs.filter(
    (j) =>
      (j.priority === 'Emergency 24 Jam' || j.priority === 'Mendesak') &&
      j.status !== 'diserahkan'
  ).length;

  // Handlers
  const handleUpdateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    const targetJob = jobs.find((job) => job.id === jobId);
    const updatedJob: JobOrder | null = targetJob
      ? {
          ...targetJob,
          status: newStatus,
          completedDate:
            newStatus === 'siap_kirim' || newStatus === 'diserahkan'
              ? new Date().toISOString().split('T')[0]
              : targetJob.completedDate,
        }
      : null;

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId && updatedJob ? updatedJob : job
      )
    );

    if (updatedJob) {
      const res = await saveJobReportToAppsScript(updatedJob, 'Laporan Tahapan SPK');
      notifyAutoSaveResult(res, async () => {
        const retryRes = await saveJobReportToAppsScript(updatedJob, 'Laporan Tahapan SPK');
        notifyAutoSaveResult(retryRes);
      });
    }
  };

  const handleSaveJob = async (
    updatedJob: JobOrder,
    reportLabel = 'Laporan SPK'
  ): Promise<AppsScriptResponse> => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    const res = await saveJobReportToAppsScript(updatedJob, reportLabel);
    notifyAutoSaveResult(res, async () => {
      const retryRes = await saveJobReportToAppsScript(updatedJob, reportLabel);
      notifyAutoSaveResult(retryRes);
    });
    return res;
  };

  const handleUpdatePaymentStatus = async (jobId: string, status: PaymentStatus) => {
    const targetJob = jobs.find((job) => job.id === jobId);
    const updatedJob: JobOrder | null = targetJob
      ? { ...targetJob, paymentStatus: status }
      : null;

    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, paymentStatus: status } : job))
    );

    if (updatedJob) {
      const res = await saveJobReportToAppsScript(updatedJob, 'Laporan Tagihan Invoice');
      notifyAutoSaveResult(res, async () => {
        const retryRes = await saveJobReportToAppsScript(updatedJob, 'Laporan Tagihan Invoice');
        notifyAutoSaveResult(retryRes);
      });
    }
  };

  const handleUpdateStock = async (
    itemId: string,
    newStock: number
  ): Promise<AppsScriptResponse> => {
    const targetItem = inventory.find((item) => item.id === itemId);
    const updatedItem = targetItem ? { ...targetItem, stock: newStock } : null;

    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item))
    );

    if (!updatedItem) {
      return {
        status: 'error',
        message: 'Material tidak ditemukan di daftar inventori.',
      };
    }

    return await saveInventoryItemToAppsScript(updatedItem);
  };

  const handleAddNewItem = async (item: InventoryItem): Promise<AppsScriptResponse> => {
    setInventory((prev) => [item, ...prev]);
    return await saveInventoryItemToAppsScript(item);
  };

  const handleReplaceInventory = (items: InventoryItem[]) => {
    setInventory(items);
  };

  const handleAddNewCustomer = async (cust: Customer) => {
    setCustomers((prev) => [cust, ...prev]);
    const res = await saveCustomerToAppsScript(cust);
    notifyAutoSaveResult(res, async () => {
      const retryRes = await saveCustomerToAppsScript(cust);
      notifyAutoSaveResult(retryRes);
    });
  };

  const handleAddNewJob = async (newJob: JobOrder) => {
    const targetCustomer = customers.find((c) => c.id === newJob.customerId);
    const updatedCustomer = targetCustomer
      ? { ...targetCustomer, totalJobs: targetCustomer.totalJobs + 1 }
      : null;

    setJobs((prev) => [newJob, ...prev]);
    // update customer total jobs
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === newJob.customerId ? { ...c, totalJobs: c.totalJobs + 1 } : c
      )
    );
    setIsNewJobOpen(false);
    setCurrentTab('jobs');

    const res = await saveJobReportToAppsScript(newJob, 'SPK & Diagnosa Awal');
    if (updatedCustomer) {
      await saveCustomerToAppsScript(updatedCustomer);
    }
    notifyAutoSaveResult(res, async () => {
      const retryRes = await saveJobReportToAppsScript(newJob, 'SPK & Diagnosa Awal');
      if (updatedCustomer) {
        await saveCustomerToAppsScript(updatedCustomer);
      }
      notifyAutoSaveResult(retryRes);
    });
  };

  const generateNextSpkNumber = () => {
    const year = new Date().getFullYear();
    const count = jobs.length + 84;
    return `SPK-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleSelectJobFromDashboard = (job: JobOrder) => {
    setSelectedJobForSpecs(job);
  };

  const handleGlobalPrint = () => {
    if (selectedJobForQC && selectedJobForQC.testReport) {
      printCertificateDocument(selectedJobForQC, selectedJobForQC.testReport);
      return;
    }
    if (selectedJobForSpecs) {
      const html = generateTechnicalSpecsHtml(
        selectedJobForSpecs,
        selectedJobForSpecs.technicalSpecs
      );
      printHtmlDocument(html, `Data Teknis Gulungan - ${selectedJobForSpecs.id}`);
      return;
    }
    if (selectedJobForInvoice) {
      const html = generateInvoiceHtml(
        selectedJobForInvoice,
        'invoice',
        selectedJobForInvoice.costs,
        selectedJobForInvoice.paymentStatus,
        selectedJobForInvoice.dpAmount || 0
      );
      printHtmlDocument(html, `Faktur Tagihan - ${selectedJobForInvoice.id}`);
      return;
    }

    const html = generateActiveViewReportHtml(currentTab, {
      jobs,
      inventory,
      customers,
      technicians,
    });
    printHtmlDocument(html, `Laporan ${currentTab} - CV. Mustofa Jaya Teknik`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'calculator') {
            setIsCalculatorOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        activeJobsCount={activeJobsCount}
        lowStockCount={lowStockCount}
        pendingQCCount={pendingQCCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenNewJob={() => setIsNewJobOpen(true)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenAppsScript={() => setCurrentTab('appscript')}
          onPrintPage={handleGlobalPrint}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          urgentJobsCount={urgentJobsCount}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {autoSaveNotice && (
            <div
              role="status"
              className={`no-print mb-4 px-4 py-2.5 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs ${
                autoSaveNotice.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span className="font-medium">{autoSaveNotice.message}</span>
              <div className="flex items-center gap-2 shrink-0">
                {autoSaveNotice.status === 'error' && autoSaveNotice.retry && (
                  <button
                    type="button"
                    onClick={() => autoSaveNotice.retry?.()}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors"
                  >
                    Coba Simpan Ulang
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAutoSaveNotice(null)}
                  className="px-2 py-0.5 rounded hover:bg-black/5 font-semibold"
                  aria-label="Tutup pemberitahuan simpan otomatis"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              jobs={jobs}
              inventory={inventory}
              technicians={technicians}
              onSelectJob={handleSelectJobFromDashboard}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
            />
          )}

          {/* TAB 2: JOBS LIST */}
          {currentTab === 'jobs' && (
            <JobOrdersView
              jobs={jobs}
              onSelectJob={(j) => setSelectedJobForSpecs(j)}
              onOpenSpecs={(j) => setSelectedJobForSpecs(j)}
              onOpenQC={(j) => setSelectedJobForQC(j)}
              onOpenInvoice={(j) => setSelectedJobForInvoice(j)}
              onOpenNewJob={() => setIsNewJobOpen(true)}
              onUpdateJobStatus={handleUpdateJobStatus}
            />
          )}

          {/* TAB 3: KANBAN WORKFLOW */}
          {currentTab === 'kanban' && (
            <JobKanbanView
              jobs={jobs}
              onSelectJob={(j) => setSelectedJobForSpecs(j)}
              onUpdateJobStatus={handleUpdateJobStatus}
              onOpenSpecs={(j) => setSelectedJobForSpecs(j)}
              onOpenQC={(j) => setSelectedJobForQC(j)}
            />
          )}

          {/* TAB 4: TECHNICAL SPECS DIRECT TABLE */}
          {currentTab === 'specs' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Buku Data Rekayasa Gulungan Dinamo Motor Listrik
                  </h2>
                  <p className="text-xs text-slate-500">
                    Spesifikasi jumlah alur, langkah kumparan (pitch span), diameter kawat email, dan kelas insulasi stator.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-slate-900">{job.id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{job.customerUnitTag}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{job.motorBrand}</h3>
                      <p className="text-xs text-slate-600">
                        {job.powerHp} HP ({job.powerKw} kW) · {job.rpm} RPM · {job.voltage}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{job.customerCompany}</p>

                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Alur Stator:</span>
                          <strong className="text-slate-800">{job.technicalSpecs.slots} Slot</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Langkah Alur:</span>
                          <strong className="text-slate-800 font-mono text-[11px]">{job.technicalSpecs.pitchSpan}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Kawat Tembaga:</span>
                          <strong className="text-slate-800 font-mono text-[11px]">
                            {job.technicalSpecs.parallelWires}x Ø {job.technicalSpecs.wireDiameterMm} mm
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Lilitan per Slot:</span>
                          <strong className="text-slate-800 font-mono text-[11px]">{job.technicalSpecs.turnsPerSlot} T</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {job.technicalSpecs.insulationClass}
                      </span>
                      <button
                        onClick={() => setSelectedJobForSpecs(job)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                      >
                        Buka & Cetak Data Sheet →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: QC & MEGGER TESTING LIST */}
          {currentTab === 'qc' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Pusat Pengujian Kualitas, Megger & Berita Acara Uji Beban
                  </h2>
                  <p className="text-xs text-slate-500">
                    Setiap motor yang selesai digulung wajib melewati uji tahanan isolasi (&gt;100 MΩ), keseimbangan fasa (&lt;2%), dan getaran bearing ISO 10816.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const hasQC = !!job.testReport;

                  return (
                    <div
                      key={job.id}
                      className={`bg-white p-4 rounded-lg border transition-all ${
                        hasQC ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900">{job.id}</span>
                          <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                            {job.motorBrand} {job.powerHp} HP ({job.powerKw} kW)
                          </h3>
                          <p className="text-xs text-slate-600">{job.customerCompany}</p>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded font-semibold ${
                            hasQC
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {hasQC ? '✓ Lolos Uji QC & Megger' : 'Belum Diuji / Dalam Proses'}
                        </span>
                      </div>

                      {hasQC && job.testReport ? (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded border border-slate-200 font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Megger Body:</span>
                            <strong className="text-emerald-700 text-sm">
                              {job.testReport.meggerStatorBodyMohm} MΩ
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Arus R/S/T:</span>
                            <strong className="text-slate-800 text-xs">
                              {job.testReport.noLoadTest.currentR_Amps}A / {job.testReport.noLoadTest.currentS_Amps}A
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Vibrasi ISO:</span>
                            <strong className="text-slate-800 text-xs">
                              {job.testReport.noLoadTest.vibrationDE_mm_s} mm/s
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded">
                          Motor berada pada tahapan: <strong>{job.status}</strong>. Siapkan peralatan Megger 1000V DC dan klem ampere untuk pengujian.
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Tag: {job.customerUnitTag}
                        </span>
                        <button
                          onClick={() => setSelectedJobForQC(job)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                            hasQC
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          {hasQC ? 'Lihat & Cetak Sertifikat QC' : 'Input Hasil Uji Megger →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: INVENTORY */}
          {currentTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              jobs={jobs}
              onUpdateStock={handleUpdateStock}
              onAddNewItem={handleAddNewItem}
              onReplaceInventory={handleReplaceInventory}
              onOpenAppsScript={() => setCurrentTab('appscript')}
            />
          )}

          {/* TAB 7: INVOICES & BILLING */}
          {currentTab === 'invoices' && (
            <InvoicesListView
              jobs={jobs}
              onOpenInvoice={(j) => setSelectedJobForInvoice(j)}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}

          {/* TAB 8: CUSTOMERS & TECHNICIANS */}
          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              technicians={technicians}
              onAddNewCustomer={handleAddNewCustomer}
            />
          )}

          {/* TAB 9: GOOGLE APPS SCRIPT & DATABASE CLOUD */}
          {currentTab === 'appscript' && (
            <AppsScriptView
              jobs={jobs}
              inventory={inventory}
              customers={customers}
              onDataImported={(data) => {
                if (data.jobs && data.jobs.length > 0) setJobs(data.jobs as JobOrder[]);
                if (data.inventory && data.inventory.length > 0) {
                  setInventory(mapSheetRowsToInventory(data.inventory, inventory));
                }
                if (data.customers && data.customers.length > 0) setCustomers(data.customers as Customer[]);
              }}
            />
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Technical Specs Modal */}
      {selectedJobForSpecs && (
        <TechnicalSpecsModal
          job={selectedJobForSpecs}
          onClose={() => setSelectedJobForSpecs(null)}
          onSave={async (updated, closeAfterSave = true) => {
            const res = await handleSaveJob(updated, 'Data Teknis Gulungan');
            setSelectedJobForSpecs(closeAfterSave ? null : updated);
            return res;
          }}
        />
      )}

      {/* Quality Control & Megger Modal */}
      {selectedJobForQC && (
        <QCTestingModal
          job={selectedJobForQC}
          onClose={() => setSelectedJobForQC(null)}
          onSave={async (updated, closeAfterSave = true) => {
            const res = await handleSaveJob(updated, 'Laporan QC & Megger');
            setSelectedJobForQC(closeAfterSave ? null : updated);
            return res;
          }}
        />
      )}

      {/* Invoice & Quotation Print Modal */}
      {selectedJobForInvoice && (
        <InvoicePrintModal
          job={selectedJobForInvoice}
          onClose={() => setSelectedJobForInvoice(null)}
          onSaveJobCosts={async (updated, closeAfterSave = true) => {
            const res = await handleSaveJob(updated, 'Laporan Tagihan Invoice');
            setSelectedJobForInvoice(closeAfterSave ? null : updated);
            return res;
          }}
        />
      )}

      {/* Rewinding Calculator Modal */}
      {isCalculatorOpen && (
        <RewindingCalculatorModal onClose={() => setIsCalculatorOpen(false)} />
      )}

      {/* New Job Registration (SPK) Modal */}
      {isNewJobOpen && (
        <NewJobModal
          customers={customers}
          technicians={technicians}
          onClose={() => setIsNewJobOpen(false)}
          onSubmit={handleAddNewJob}
          nextSpkNumber={generateNextSpkNumber()}
        />
      )}
    </div>
  );
}
