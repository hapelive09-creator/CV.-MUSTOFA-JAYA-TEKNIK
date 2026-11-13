import React, { useState } from 'react';
import { Customer, Technician } from '../types';
import {
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Plus,
  Wrench,
  Search,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  technicians: Technician[];
  onAddNewCustomer: (cust: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  technicians,
  onAddNewCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'technicians'>('customers');
  const [search, setSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New Customer State
  const [newCust, setNewCust] = useState<Partial<Customer>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    industryType: 'Manufaktur Industri',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.company) return;

    const created: Customer = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name: newCust.name,
      company: newCust.company,
      phone: newCust.phone || '-',
      email: newCust.email || '-',
      address: newCust.address || '-',
      industryType: newCust.industryType || 'Manufaktur Industri',
      totalJobs: 0,
    };

    onAddNewCustomer(created);
    setShowAddCustomerModal(false);
    setNewCust({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      industryType: 'Manufaktur Industri',
    });
  };

  return (
    <div className="space-y-4">
      {/* Subnav Tabs */}
      <div className="flex border-b border-slate-200/80 bg-white p-1.5 rounded-xl border gap-1.5 text-xs shadow-2xs">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'customers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Pelanggan Pabrik & Industri
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              activeTab === 'customers' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('technicians')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'technicians'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Tim Teknisi Bengkel
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              activeTab === 'technicians' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {technicians.length}
          </span>
        </button>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative min-w-[280px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama PIC, nama pabrik, telepon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
              />
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-xs transition-all whitespace-nowrap self-end md:self-auto"
            >
              + Tambah Pelanggan Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">{cust.id}</span>
                      <h3 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug">
                        {cust.company}
                      </h3>
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">{cust.name}</p>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold border border-slate-200/80">
                      {cust.totalJobs} SPK
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{cust.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{cust.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed line-clamp-2 text-slate-500">
                        {cust.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {cust.industryType}
                  </span>
                  <a
                    href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                  >
                    Hubungi WA <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TECHNICIANS TAB */}
      {activeTab === 'technicians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 border border-slate-800 flex items-center justify-center mb-3 font-bold text-sm shadow-2xs">
                  {tech.name.substring(0, 2).toUpperCase()}
                </div>

                <div className="text-[10px] font-mono text-slate-400">{tech.id}</div>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{tech.name}</h3>
                <p className="text-xs font-semibold text-amber-700">{tech.role}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[11px]">{tech.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Beban Kerja:</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                  {tech.activeJobsCount} Unit Motor
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Tambah Data Pelanggan Industri Baru
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Perusahaan / Pabrik:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Sumber Tirta Industri"
                  value={newCust.company}
                  onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Kontak PIC / Maintenance:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Bambang"
                    value={newCust.name}
                    onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bidang Industri:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Makanan & Minuman"
                    value={newCust.industryType}
                    onChange={(e) => setNewCust({ ...newCust, industryType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. HP / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email PIC:</label>
                  <input
                    type="email"
                    placeholder="pic@perusahaan.com"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Pabrik / Fasilitas:</label>
                <textarea
                  rows={2}
                  placeholder="Kawasan Industri..."
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
